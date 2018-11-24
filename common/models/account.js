'use strict';

const {exec} = require('child_process');
const speakeasy = require('speakeasy');
const methods = require('./account.json').methods;

module.exports = function(Account) {
  Account.adamantAddress = function(adamantAddress, id, next) {
    // Id must be restricted to owner
    Account.findById(id, (err, account) => {
      if (err) next(err);
      const secret = speakeasy.generateSecret({
        name: 'ADAMANT-' + adamantAddress,
      });
      const seCounter = 1;
      const data = {
        adamantAddress,
        seCounter,
        seSecretAscii: secret.ascii,
        seSecretBase32: secret.base32,
        seSecretHex: secret.hex,
        seSecretUrl: secret.otpauth_url,
      };
      account.updateAttributes(data, err => {
        if (err) next(err);
        admSend(account, {adamantAddress}, next);
      });
    });
  };

  Account.disable2fa = function(id, next) {
    // Id must be restricted to owner
    Account.findById(id, (err, account) => {
      if (err) next(err);
      account.updateAttributes({
        se2faEnabled: false,
      });
      next(null, false);
    });
  };

  Account.verifyHotp = function(hotp, id, next) {
    // Id must be restricted to owner
    Account.findById(id, (err, account) => {
      if (err) next(err);
      let verified = false;
      if (/^\d{6}$/.test(hotp)) {
        verified = speakeasy.hotp.verify({
          counter: account.seCounter,
          // encoding: 'ascii',
          secret: account.seSecretAscii,
          token: hotp,
        });
        if (verified) {
          account.updateAttributes({
            se2faEnabled: true,
            seCounter: account.seCounter + 1,
          }, err => {
            if (err) next(err);
            // Generate new code
            admSend(account, {verified}, next);
          });
        } else next(null, {verified});
      } else next(null, {verified});
    });
  };

  Account.afterRemote('login', function(ctx, output, next) {
    Account.findById(output.userId, (err, account) => {
      if (err) next(err);
      output.setAttributes({
        adamantAddress: account.adamantAddress,
        se2faEnabled: account.se2faEnabled,
      });
      next(null, output);
    });
  });

  Account.remoteMethod('adamantAddress', methods.adamantAddress);
  Account.remoteMethod('verifyHotp', methods.verifyHotp);

  Account.validatesExclusionOf('username', {
    in: ['admin'],
    message: 'This username not allowed',
  });
  Account.validatesFormatOf('adamantAddress', {
    allowNull: true,
    message: 'Address does not match pattern',
    with: /^U\d+$/,
  });
  Account.validatesLengthOf('adamantAddress', {
    allowNull: true,
    message: {
      max: 'Address is too long',
      min: 'Address is too short',
    },
    max: 23,
    min: 7,
  });
  Account.validatesPresenceOf('username', 'password');
  Account.validatesUniquenessOf('username', {
    adamantAddress: 'Address already registered',
    message: 'User already exists',
  });

  function admSend(account, payload, next) {
    const hotp = speakeasy.hotp({
      // encoding: 'ascii',
      counter: account.seCounter,
      secret: account.seSecretAscii,
    });
    const command = `
      adm send message ${account.adamantAddress} "2FA code: ${hotp}"
    `;
    exec(command, function(err, stdout, stderr) {
      if (err) {
        next(err);
      } else {
        console.info(command, stdout, stderr);
        try {
          var answer = JSON.parse(stdout);
        } catch (err) {
          next(err);
          answer = {success: false};
        }
      };
      next(null, Object.assign(answer, payload));
    });
  }
};
