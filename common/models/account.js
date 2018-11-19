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
      const token = speakeasy.hotp({
        seCounter,
        secret: secret.base32,
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
      next(null, { // @todo Send token to ADAMANT address
        adamantAddress,
        hotp: token,
        id,
      });
    });
  };
  Account.remoteMethod('adamantAddress', methods.adamantAddress);
};
