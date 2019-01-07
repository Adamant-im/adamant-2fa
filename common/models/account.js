'use strict';

const {exec} = require('child_process');
const g = require('loopback/lib/globalize');
const speakeasy = require('speakeasy');
const MAX_PASSWORD_LENGTH = 15;
const MIN_PASSWORD_LENGTH = 8;

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
          seCounter: this.seCounter + 1,
        }, error => {
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
            }, error => {
              if (error) return next(error);
              // Generate new code
              admSend(this, {se2faEnabled}, next);
            });
          });
        });
      } else next(null, {se2faEnabled});
    } else next(null, {se2faEnabled});
  };

  Account.prototype.disable2fa = function(next) {
    const res = {se2faEnabled: false};
    this.updateAttributes(res, error => {
      if (error) return next(error);
      next(null, res);
    });
  };

  Account.prototype.updateLocale = function(locale, next) {
    const res = {locale};
    this.updateAttributes(res, error => {
      if (error) return next(error);
      next(null, res);
    });
  };

  Account.prototype.updateAdamantAddress = function(adamantAddress, next) {
    const secret = speakeasy.generateSecret({
      name: 'ADAMANT-' + adamantAddress,
    });
    const seCounter = 1;
    const data = {
      // adamantAddress,
      seCounter,
      seSecretAscii: secret.ascii,
      seSecretBase32: secret.base32,
      seSecretHex: secret.hex,
      seSecretUrl: secret.otpauth_url,
    };
    this.updateAttributes(data, error => {
      if (error) return next(error);
      admSend(this, {adamantAddress}, next);
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
        this.updateAttribute('seCounter', this.seCounter + 1, error => {
          if (error) return next(error);
          const Role = Account.app.models.Role;
          const RoleMapping = Account.app.models.RoleMapping;
          // 2FA verification passed, grant permission
          Role.findOne({where: {name: 'authorized'}}, (error, role) => {
            if (error) return next(error);
            RoleMapping.findOrCreate({where: {principalId: this.id}}, {
              principalType: 'USER',
              principalId: this.id,
              roleId: role.getId(),
            }, error => {
              if (error) return next(error);
              // Generate new code
              admSend(this, {se2faVerified}, next);
            });
          });
        });
      } else next(null, {se2faVerified});
    } else next(null, {se2faVerified});
  };

  // Failed request goes to afterRemoteError handler instead
  Account.afterRemote('login', function(ctx, result, next) {
    Account.findById(result.userId, (error, account) => {
      if (error) return next(error);
      const Role = Account.app.models.Role;
      const RoleMapping = Account.app.models.RoleMapping;
      result.setAttributes({
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
              // Revoke prevously assigned role and wait for 2FA verification
              roleMapping.destroy(error => {
                if (error) return next(error);
                next(null, result);
              });
            } else next(null, result);
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
          }, error => {
            if (error) return next(error);
            next(null, result);
          });
        });
      }
    });
  });

  Account.afterRemote('prototype.updateAdamantAddress', function(ctx, result, next) {
    let error;
    if (result.error) {
      error = new Error();
      error.statusCode = 422;
      error.message = error.message || result.error.toLowerCase();
      error.code = result.error.toUpperCase().replace(' ', '_');
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
  Account.validatesUniquenessOf('adamantAddress', {
    adamantAddress: 'Address already registered',
  });
  Account.validatesUniquenessOf('username', {
    message: 'User already exists',
  });

  // validatesLengthOf is not applicable for password.
  // Recommended solution is to override User.validatePassword method:
  // https://github.com/strongloop/loopback/pull/941
  Account.validatePassword = function(plain) {
    var error;
    if (!plain || typeof plain !== 'string') {
      error = new Error(g.f('Invalid password.'));
      error.code = 'INVALID_PASSWORD';
      error.statusCode = 422;
      throw error;
    }
    // Bcrypt only supports up to 72 bytes; the rest is silently dropped.
    var len = Buffer.byteLength(plain, 'utf8');
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

  function admSend(account, payload, next) {
    const hotp = speakeasy.hotp({
      counter: account.seCounter,
      // encoding: 'ascii',
      secret: account.seSecretAscii,
    });
    const command = `
      adm send message ${payload.adamantAddress || account.adamantAddress} "2FA code: ${hotp}"
    `;
    exec(command, function(error, stdout, stderr) {
      if (error) return next(error);
      console.info(command, stdout, stderr);
      try {
        var answer = JSON.parse(stdout);
      } catch (x) {
        answer = {
          error: 'unprocessable entity',
          message: String(stdout).toLowerCase(),
        };
      }
      // Save only known ADAMANT address
      if (payload.adamantAddress && !answer.error) {
        account.updateAttribute('adamantAddress', payload.adamantAddress, error => {
          if (error) return next(error);
          next(null, Object.assign(answer, payload));
        });
      } else next(null, Object.assign(answer, payload));
    });
  }
};
