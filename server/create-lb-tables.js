/**
 * @url https://loopback.io/doc/en/lb3/Creating-a-database-schema-from-models
 *   #creating-database-tables-for-built-in-models
 * @url https://loopback.io/doc/en/lb3/Attaching-models-to-data-sources.html
 */
'use strict';

const server = require('./server');
const ds = server.dataSources.postgresql10;
const lbTables = ['Account', 'User', 'AccessToken', 'ACL', 'RoleMapping', 'Role'];
ds.automigrate(lbTables, function(error) {
  if (error) throw error;
  console.log('Loopback tables [' + lbTables + '] created in', ds.adapter.name);
  server.models.Role.create({
    description: 'Indicates that user authorized to access his account',
    name: 'authorized',
  }, function(error, role) {
    if (error) throw error;
    console.log('Created role:', role);
    ds.disconnect();
  });
});
