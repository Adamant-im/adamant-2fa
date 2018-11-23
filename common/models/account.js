'use strict';

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
      const seCounter = 1; // @todo Random counter
      const hotp = speakeasy.hotp({
        encoding: 'ascii',
        counter: seCounter,
        secret: secret.ascii,
      });
      const data = {
        adamantAddress,
        seCounter,
        seSecretAscii: secret.ascii,
        seSecretBase32: secret.base32,
        seSecretHex: secret.hex,
        seSecretUrl: secret.otpauth_url,
      };
      account.updateAttributes(data);
      next(null, {
        adamantAddress,
        hotp, // @todo Send HOTP to ADAMANT address instead
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
      let verified;
      if (/\d{6}/.test(hotp)) {
        verified = speakeasy.hotp.verify({
          counter: account.seCounter,
          encoding: 'ascii',
          secret: account.seSecretAscii,
          token: hotp,
        });
        account.updateAttributes({
          se2faEnabled: verified,
        });
      } else verified = false;
      // @todo Send new HOTP to ADAMANT address
      next(null, verified);
    });
  };

  Account.afterRemote('login', function(ctx, output, next) {
    Account.findById(output.userId, (err, account) => {
      if (err) next(err);
      output.setAttribute('adamantAddress', account.adamantAddress);
      output.setAttribute('se2faEnabled', account.se2faEnabled);
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
      min: 'Address is too short',
      max: 'Address is too long',
    },
    max: 23,
    min: 7,
  });
  Account.validatesPresenceOf('username', 'password');
  Account.validatesUniquenessOf('username', {
    message: 'User already exists',
  });
};
