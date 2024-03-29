/**
 * @url https://loopback.io/doc/en/lb3/Creating-a-database-schema-from-models
 *   #creating-database-tables-for-built-in-models
 * @url https://loopback.io/doc/en/lb3/Attaching-models-to-data-sources.html
 */
'use strict';

const server = require('./server');
const logger = require('../helpers/logger');

const ds = server.dataSources.postgresql;
const lbTables = ['Account', 'User', 'AccessToken', 'ACL', 'RoleMapping', 'Role'];
ds.automigrate(lbTables, function(error) {
  if (error) throw error;
  logger.info(`Loopback tables [${lbTables}] created in ${ds.adapter.name}`);
  server.models.Role.create({
    description: 'Indicates that user authorized to access his account',
    name: 'authorized',
  }, function(error, role) {
    if (error) throw error;
    logger.info(`Created role: ${JSON.stringify(role)}`);

    ds.disconnect();
    logger.info('Finished');
    process.exit();
  });
});
