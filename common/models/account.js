'use strict';

const speakeasy = require('speakeasy');
const methods = require('./account.json').methods;

module.exports = function(Account) {
  Account.adamantAddress = function(adamantAddress, id, next) {
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
      next(null, { // @todo Send HOTP to ADAMANT address
        adamantAddress,
        hotp,
        id,
      });
    });
  };
  Account.verifyHotp = function(hotp, id, next) {
    Account.findById(id, (err, account) => {
      if (err) next(err);
      const verified = speakeasy.hotp.verify({
        counter: account.seCounter,
        encoding: 'ascii',
        secret: account.seSecretAscii,
        token: hotp,
      });
      next(null, verified);
    });
  };
  Account.remoteMethod('adamantAddress', methods.adamantAddress);
  Account.remoteMethod('verifyHotp', methods.verifyHotp);
};
