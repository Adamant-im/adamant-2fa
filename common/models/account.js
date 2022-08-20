'use strict';

const g = require('loopback/lib/globalize');
const speakeasy = require('speakeasy');
const logger = require('../../helpers/logger');
const adamantApi = require('adamant-console');
const MAX_PASSWORD_LENGTH = 15;
const MIN_PASSWORD_LENGTH = 3;

module.exports = function(Account) {
  Account.prototype.enable2fa = function(hotp, next) {
    let se2faEnabled = false;
    if (/^\d{6}$/.test(hotp)) {
      se2faEnabled = speakeasy.hotp.verify({
        counter: this.seCounter,
        // encoding: 'ascii',
        secret: this.seSecretAscii,
        token: hotp,
      });
      if (se2faEnabled) {
        this.updateAttributes({
          se2faEnabled: true,
          seCounter: this.seCounter,
        }, (error) => {
          if (error) return next(error);
          const Role = Account.app.models.Role;
          const RoleMapping = Account.app.models.RoleMapping;
          // 2FA enabled and verified, allow
          Role.findOne({where: {name: 'authorized'}}, (error, role) => {
            if (error) return next(error);
            RoleMapping.findOrCreate({where: {principalId: this.id}}, {
              principalType: 'USER',
              principalId: this.id,
              roleId: role.getId(),
            }, (error) => {
              if (error) return next(error);
              next(null, {se2faEnabled});
            });
          });
        });
      } else next(null, {se2faEnabled});
    } else next(null, {se2faEnabled});
  };

  Account.prototype.disable2fa = function(next) {
    const res = {se2faEnabled: false};
    this.updateAttributes(res, (error) => {
      if (error) return next(error);
      next(null, res);
    });
  };

  Account.prototype.updateLocale = function(locale, next) {
    const res = {locale};
    this.updateAttributes(res, (error) => {
      if (error) return next(error);
      next(null, res);
    });
  };

  Account.prototype.updateAdamantAddress = function(adamantAddress, next) {
    const secret = speakeasy.generateSecret({
      name: 'ADAMANT-' + adamantAddress,
    });
    const data = {
      // adamantAddress,
      seCounter: 0,
      seSecretAscii: secret.ascii,
      seSecretBase32: secret.base32,
      seSecretHex: secret.hex,
      seSecretUrl: secret.otpauth_url,
    };
    this.updateAttributes(data, (error) => {
      if (error) return next(error);
      send2fa(adamantAddress, this).then((result) => {
        if (result.success) {
          this.updateAttribute('adamantAddress', adamantAddress, (error) => {
            if (error) return next(error);
            next(null, {...result, ...{adamantAddress}});
          });
        } else {
          const error = {};
          error.statusCode = result?.error ? 422 : 500;
          error.message = 'Failed to send 2fa';
          next(error);
        }
      });
    });
  };

  Account.prototype.verify2fa = function(hotp, next) {
    let se2faVerified = false;
    if (/^\d{6}$/.test(hotp)) {
      se2faVerified = speakeasy.hotp.verify({
        counter: this.seCounter,
        // encoding: 'ascii',
        secret: this.seSecretAscii,
        token: hotp,
      });
      if (se2faVerified) {
        this.updateAttribute('seCounter', this.seCounter, (error) => {
          if (error) return next(error);
          const Role = Account.app.models.Role;
          const RoleMapping = Account.app.models.RoleMapping;
          // 2FA verification passed, allow
          Role.findOne({where: {name: 'authorized'}}, (error, role) => {
            if (error) return next(error);
            RoleMapping.findOrCreate({where: {principalId: this.id}}, {
              principalType: 'USER',
              principalId: this.id,
              roleId: role.getId(),
            }, (error) => {
              if (error) return next(error);
              next(null, {se2faVerified});
            });
          });
        });
      } else next(null, {se2faVerified});
    } else next(null, {se2faVerified});
  };

  // Failed request goes to afterRemoteError handler instead
  Account.afterRemote('login', function(ctx, res, next) {
    Account.findById(res.userId, (error, account) => {
      if (error) return next(error);
      const Role = Account.app.models.Role;
      const RoleMapping = Account.app.models.RoleMapping;
      res.setAttributes({
        adamantAddress: account.adamantAddress,
        locale: account.locale,
        se2faEnabled: account.se2faEnabled,
        username: account.username,
      });
      // Check that user authorized to access account
      if (account.se2faEnabled) {
        // 2FA enabled
        Role.findOne({where: {name: 'authorized'}}, (error, role) => {
          if (error) return next(error);
          RoleMapping.findOne({where: {principalId: account.id}}, {
            principalType: 'USER',
            principalId: account.id,
            roleId: role.getId(),
          }, (error, roleMapping) => {
            if (error) return next(error);
            if (roleMapping) {
              // Revoke previously assigned role and wait for 2FA verification
              roleMapping.destroy((error) => {
                if (error) return next(error);
                send2fa(res.adamantAddress, account).then((result) => {
                  if (result?.success) {
                    res.setAttribute('se2faTx', (result).transactionId);
                    next(null, res);
                  } else {
                    const error = {};
                    error.statusCode = result?.error ? 422 : 500;
                    error.message = 'Failed to send 2fa';
                    next(error);
                  }
                });
              });
            } else {
              send2fa(res.adamantAddress, account).then((result) => {
                if (result?.success) {
                  res.setAttribute('se2faTx', result.transactionId);
                  next(null, res);
                } else {
                  const error = {};
                  error.statusCode = result?.error ? 422 : 500;
                  error.message = 'Failed to send 2fa';
                  next(error);
                }
              });
            }
          });
        });
      } else {
        // 2FA disabled, allow
        Role.findOne({where: {name: 'authorized'}}, (error, role) => {
          if (error) return next(error);
          RoleMapping.findOrCreate({where: {principalId: account.id}}, {
            principalType: 'USER',
            principalId: account.id,
            roleId: role.getId(),
          }, (error) => {
            if (error) return next(error);
            next(null, res);
          });
        });
      }
    });
  });

  Account.afterRemote('prototype.updateAdamantAddress', function(ctx, res, next) {
    let error;
    if (res.error) {
      error = new Error();
      error.statusCode = 422;
      error.message = error.message || res.error.toLowerCase();
      error.code = res.error.toUpperCase().replace(' ', '_');
    }
    next(error);
  });

  Account.validatesExclusionOf('username', {
    in: ['admin'],
    message: 'This username not allowed',
  });
  Account.validatesFormatOf('adamantAddress', {
    allowNull: true,
    message: 'Address does not match pattern',
    with: /^U\d+$/,
  });
  Account.validatesFormatOf('locale', {
    allowNull: true,
    message: 'Locale does not match pattern',
    with: /^[a-z]{2}$/,
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
  Account.validatesLengthOf('username', {
    message: {
      max: 'Username is too long',
      min: 'Username is too short',
    },
    max: 25,
    min: 3,
  });
  Account.validatesPresenceOf('username', 'password');
  Account.validatesUniquenessOf('username', {
    message: 'User already exists',
  });

  // validatesLengthOf is not applicable for password.
  // Recommended solution is to override User.validatePassword method:
  // https://github.com/strongloop/loopback/pull/941
  Account.validatePassword = function(plain) {
    let error;
    if (!plain || typeof plain !== 'string') {
      error = new Error(g.f('Invalid password.'));
      error.code = 'INVALID_PASSWORD';
      error.statusCode = 422;
      throw error;
    }
    // Bcrypt only supports up to 72 bytes; the rest is silently dropped.
    const len = Buffer.byteLength(plain, 'utf8');
    if (len > MAX_PASSWORD_LENGTH) {
      error = new Error(g.f('The password entered was too long. Max length is %d (entered %d)',
          MAX_PASSWORD_LENGTH, len));
      error.code = 'PASSWORD_TOO_LONG';
      error.statusCode = 422;
      throw error;
    }
    if (len < MIN_PASSWORD_LENGTH) {
      error = new Error(g.f('The password entered was too short. Min length is %d (entered %d)',
          MIN_PASSWORD_LENGTH, len));
      error.code = 'PASSWORD_TOO_SHORT';
      error.statusCode = 422;
      throw error;
    }
  };

  function send2fa(adamantAddress, account) {
    const counter = account.seCounter + 1;
    return new Promise((resolve, reject) => {
      account.updateAttribute('seCounter', counter, async (err) => {
        if (err) return reject(err);
        const hotp = speakeasy.hotp({
          counter,
          // encoding: 'ascii',
          secret: account.seSecretAscii,
        });

        const message = `2FA code: ${hotp}`;
        adamantApi.sendMessage(
            adamantAddress,
            message,
        ).then((res) => {
          if (res?.success) {
            logger.log(`2FA message '${message}' sent to ${adamantAddress}: ${JSON.stringify(res)}`);
            resolve(res);
          } else {
            logger.error(`Failed to send ADM message '${message}' to ${adamantAddress}. ${res?.errorMessage ?? res?.error}.`);
            resolve(res);
          }
        }).catch((err) => {
          logger.error(`Error while sending ADM message '${message}' to ${adamantAddress}. ${err}.`);
          resolve(err);
        });
      });
    }).catch((err) => logger.error(err));
  }
};
