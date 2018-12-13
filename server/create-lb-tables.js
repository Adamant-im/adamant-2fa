/**
 * @url https://loopback.io/doc/en/lb3/Creating-a-database-schema-from-models
 *   #creating-database-tables-for-built-in-models
 * @url https://loopback.io/doc/en/lb3/Attaching-models-to-data-sources.html
 */
'use strict';

var server = require('./server');
var ds = server.dataSources.postgresql10;
var lbTables = ['Account', 'User', 'AccessToken', 'ACL', 'RoleMapping', 'Role'];
ds.automigrate(lbTables, function(er) {
  if (er) throw er;
  console.log('Loopback tables [' + lbTables + '] created in', ds.adapter.name);
  ds.disconnect();
});
