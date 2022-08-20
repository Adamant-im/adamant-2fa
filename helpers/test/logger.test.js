const logger = require('../logger');
const constants = require('./constants');

describe('logger: log', () => {
  const logLevel = 'log';

  test('Should log log level', (done) => {
    logger.initLogger(logLevel, {
      log(...objs) {
        const str = objs.join('');
        expect(str).toEqual(expect.stringMatching(new RegExp(constants.LOG_FORMAT_REGEX.source + /(log)/.source)));

        done();
      },
    });

    logger.log('log');
  });

  test('Should log info level', (done) => {
    logger.initLogger(logLevel, {
      log(...objs) {
        const str = objs.join('');
        expect(str).toEqual(expect.stringMatching(new RegExp(constants.INFO_FORMAT_REGEX.source + /(info)/.source)));

        done();
      },
    });

    logger.info('info');
  });

  test('Should log warn level', (done) => {
    logger.initLogger(logLevel, {
      log(...objs) {
        const str = objs.join('');
        expect(str).toEqual(expect.stringMatching(new RegExp(constants.WARN_FORMAT_REGEX.source + /(warn)/.source)));

        done();
      },
    });

    logger.warn('warn');
  });

  test('Should log error level', (done) => {
    logger.initLogger(logLevel, {
      log(...objs) {
        const str = objs.join('');
        expect(str).toEqual(expect.stringMatching(new RegExp(constants.ERROR_FORMAT_REGEX.source + /(error)/.source)));

        done();
      },
    });

    logger.error('error');
  });
});

describe('logger: info', () => {
  const logLevel = 'info';

  test('Should not log log level', (done) => {
    logger.initLogger(logLevel, {
      log() {
        done('Log level has been called');
      },
    });

    logger.log('log');
    done();
  });

  test('Should log info level', (done) => {
    logger.initLogger(logLevel, {
      log(...objs) {
        const str = objs.join('');
        expect(str).toEqual(expect.stringMatching(new RegExp(constants.INFO_FORMAT_REGEX.source + /(info)/.source)));

        done();
      },
    });

    logger.info('info');
  });
 
  test('Should log warn level', (done) => {
    logger.initLogger(logLevel, {
      log(...objs) {
        const str = objs.join('');
        expect(str).toEqual(expect.stringMatching(new RegExp(constants.WARN_FORMAT_REGEX.source + /(warn)/.source)));

        done();
      },
    });

    logger.warn('warn');
  });

  test('Should log error level', (done) => {
    logger.initLogger(logLevel, {
      log(...objs) {
        const str = objs.join('');
        expect(str).toEqual(expect.stringMatching(new RegExp(constants.ERROR_FORMAT_REGEX.source + /(error)/.source)));

        done();
      },
    });

    logger.error('error');
  });
});

describe('logger: warn', () => {
  const logLevel = 'warn';

  test('Should not log log level', (done) => {
    logger.initLogger(logLevel, {
      log() {
        done('Log level has been called');
      },
    });

    logger.log('log');
    done();
  });

  test('Should not log info level', (done) => {
    logger.initLogger(logLevel, {
      log() {
        done('Info level has been called');
      },
    });

    logger.info('info');
    done();
  });

  test('Should log warn level', (done) => {
    logger.initLogger(logLevel, {
      log(...objs) {
        const str = objs.join('');
        expect(str).toEqual(expect.stringMatching(new RegExp(constants.WARN_FORMAT_REGEX.source + /(warn)/.source)));

        done();
      },
    });

    logger.warn('warn');
  });

  test('Should log error level', (done) => {
    logger.initLogger(logLevel, {
      log(...objs) {
        const str = objs.join('');
        expect(str).toEqual(expect.stringMatching(new RegExp(constants.ERROR_FORMAT_REGEX.source + /(error)/.source)));

        done();
      },
    });

    logger.error('error');
  });
});

describe('logger: error', () => {
  const logLevel = 'error';

  test('Should not log log level', (done) => {
    logger.initLogger(logLevel, {
      log() {
        done('Log level has been called');
      },
    });

    logger.log('log');
    done();
  });

  test('Should not log info level', (done) => {
    logger.initLogger(logLevel, {
      log() {
        done('Info level has been called');
      },
    });

    logger.info('info');
    done();
  });

  test('Should not log warn level', (done) => {
    logger.initLogger(logLevel, {
      log() {
        done('Warn level has been called');
      },
    });

    logger.warn('warn');
    done();
  });

  test('Should log error level', (done) => {
    logger.initLogger(logLevel, {
      log(...objs) {
        const str = objs.join('');
        expect(str).toEqual(expect.stringMatching(new RegExp(constants.ERROR_FORMAT_REGEX.source + /(error)/.source)));

        done();
      },
    });

    logger.error('error');
  });
});
