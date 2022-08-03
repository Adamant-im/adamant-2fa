const fs = require('fs');
const jsonminify = require('jsonminify');
const isDev = process.argv.includes('dev');
const keys = require('adamant-api/src/helpers/keys');
const logger = require('../helpers/logger');
let config = {};

const fields = {
  passPhrase: {
    type: String,
    isRequired: true,
  },
};

try {
  if (isDev || process.env.JEST_WORKER_ID) {
    config = JSON.parse(jsonminify(fs.readFileSync('./config.test', 'utf-8')));
  } else {
    const configFile = fs.existsSync('./config.json') ? './config.json' : './config.default.json';
    config = JSON.parse(jsonminify(fs.readFileSync(configFile, 'utf-8')));
  }

  if (!config.passPhrase || config.passPhrase.length < 35) {
    exit(`Bot's config is wrong. Set an ADAMANT passPhrase to manage the Bot.`);
  }

  let keyPair;
  try {
    keyPair = keys.createKeypairFromPassPhrase(config.passPhrase);
  } catch (e) {
    exit(`Bot's config is wrong. Invalid passPhrase. Error: ${e}. Cannot start the Bot.`);
  }
  const address = keys.createAddressFromPublicKey(keyPair.publicKey);

  Object.keys(fields).forEach((f) => {
    if (!config[f] && fields[f].required) {
      exit(`Bot's ${address} config is wrong. Field _${f}_ is not valid. Cannot start Bot.`);
    } else if (!config[f] && config[f] !== 0 && fields[f].default) {
      config[f] = fields[f].default;
    }
    if (config[f] && fields[f].type !== config[f].__proto__.constructor) {
      exit(`Bot's ${address} config is wrong. Field type _${f}_ is not valid, expected type is _${fields[f].type.name}_. Cannot start Bot.`);
    }
    if (config[f] && fields[f].type !== config[f].__proto__.constructor) {
      exit(`Bot's ${address} config is wrong. Field type _${f}_ is not valid, expected type is _${fields[f].type.name}_. Cannot start Bot.`);
    }

    logger.info(`The bot ${address} successfully read a config-file${isDev ? ' (dev)' : ''}.`);
  });
} catch (e) {
  exit(`Error reading config: ${e}`);
}

function exit(msg) {
  logger.error(msg);
  process.exit(-1);
}

module.exports = config;
