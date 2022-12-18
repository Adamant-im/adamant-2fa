const logger = require('../../helpers/logger');

module.exports = function() {
  return function(err, req, res, next) {
    logger.error(`Request ${req.method} ${req.url} failed: ${err}`);
    next(err);
  };
};
