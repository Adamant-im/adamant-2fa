'use strict';

module.exports = function(app) {
  const Role = app.models.Role;
  const RoleMapping = app.models.RoleMapping;
  // User asks authorization to access account
  Role.registerResolver('authorized', function(role, ctx, next) {
    ctx.model.findById(ctx.modelId, function(error, account) {
      if (error) return next(error);
      if (ctx.accessToken.userId) {
        // User had authenticated
        if (account.se2faEnabled) {
          // Check that user had passed 2FA verification
          Role.findOne({where: {name: 'authorized'}}, (error, role) => {
            if (error) return next(error);
            RoleMapping.findOne({
              principalType: 'USER',
              principalId: account.id,
              roleId: role.getId(),
            }, (error, roleMapping) => {
              if (error) return next(error);
              if (roleMapping) {
                // User had verified, allow
                next(null, true);
              } else {
                // User had not verified, deny
                next(null, false);
              }
            });
          });
        } else next(null, true); // 2FA disabled, allow
      } else {
        // User unauthenticated, deny
        Role.findOne({where: {name: 'authorized'}}, (error, role) => {
          if (error) return next(error);
          RoleMapping.findOne({
            principalType: 'USER',
            principalId: account.id,
            roleId: role.getId(),
          }, (error, roleMapping) => {
            if (error) return next(error);
            if (roleMapping) {
              // Revoke prevously assigned role
              roleMapping.destroy(error => {
                if (error) return next(error);
                next(null, false);
              });
            } else next(null, false);
          });
        });
      }
    });
  });
};
