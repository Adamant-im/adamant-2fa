'use strict';

module.exports = function enableAuthentication(server) {
  // Removing email requirement
  delete server.models.Account.validations.email;
  // Enable authentication
  server.enableAuth({
    // Let LoopBack take care of attaching any built-in models required by the access control feature
    datasource: 'postgresql10',
  });
};
