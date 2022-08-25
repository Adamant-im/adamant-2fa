const loopback = require('loopback');
const boot = require('loopback-boot');
const axios = require('axios');

const port = 3000;
const host = 'localhost';
const baseUrl = `http://${host}:${port}/api/Accounts`;

beforeAll(() => {
  const app = loopback();
  app.start = function() {
    app.dataSource('db', {connector: 'memory'});
    const AccountSchema = require('../account.json');
    const Account = app.registry.createModel(AccountSchema);
    require('../account')(Account);
    app.model(Account, {dataSource: 'db'});
    app.use('/api', loopback.rest());
    return app.listen({host: host, port: port});
  };

  boot(app, __dirname, function(err) {
    if (err) throw err;
    app.start();
  });
});

describe('Sign up:', () => {
  beforeAll(async () => {
    await axios({
      url: `${baseUrl}`,
      method: 'get',
    }).catch((err) => err);
  });
  test('Should not pass no username and no password', async () => {
    return await expect(axios({
      url: `${baseUrl}`,
      method: 'post',
      data: {
        locale: 'en',
      },
    })).rejects.toThrow('Request failed with status code 422');
  });

  test('Should not pass no username', async () => {
    return await expect(axios({
      url: `${baseUrl}`,
      method: 'post',
      data: {
        password: 'password',
      },
    })).rejects.toThrow('Request failed with status code 422');
  });

  test('Should not pass less than 3 characters username', async () => {
    return await expect(axios({
      url: `${baseUrl}`,
      method: 'post',
      data: {
        username: 'si',
        password: 'password',
      },
    })).rejects.toThrow('Request failed with status code 422');
  });

  test('Should not pass no password', async () => {
    return await expect(axios({
      url: `${baseUrl}`,
      method: 'post',
      data: {
        username: 'test',
      },
    })).rejects.toThrow('Request failed with status code 422');
  });

  test('Should not pass less than 3 characters password', async () => {
    return await expect(axios({
      url: `${baseUrl}`,
      method: 'post',
      data: {
        username: 'test',
        password: 'pa',
      },
    })).rejects.toThrow('Request failed with status code 422');
  });

  test('Should pass correct username and password', async () => {
    return await expect(axios({
      url: `${baseUrl}`,
      method: 'post',
      data: {
        locale: 'en',
        username: 'test',
        password: 'password',
      },
    })).resolves.toEqual(expect.objectContaining({status: 200}));
  });

  test('Should not pass existing username', async () => {
    return await expect(axios({
      url: `${baseUrl}`,
      method: 'post',
      data: {
        username: 'test',
        password: 'password',
      },
    })).rejects.toThrow('Request failed with status code 422');
  });
});

describe('Log in:', () => {
  test('Should not pass no username and no password', async () => {
    return await expect(axios({
      url: `${baseUrl}/login`,
      method: 'post',
      data: {
      },
    })).rejects.toThrow('Request failed with status code 400');
  });

  test('Should not pass no username', async () => {
    return await expect(axios({
      url: `${baseUrl}/login`,
      method: 'post',
      data: {
        password: 'password',
      },
    })).rejects.toThrow('Request failed with status code 400');
  });

  test('Should not pass no password', async () => {
    return await expect(axios({
      url: `${baseUrl}/login`,
      method: 'post',
      data: {
        username: 'test',
      },
    })).rejects.toThrow('Request failed with status code 401');
  });

  test('Should not pass invalid username', async () => {
    return await expect(axios({
      url: `${baseUrl}/login`,
      method: 'post',
      data: {
        username: 'invalid',
        password: 'password',
      },
    })).rejects.toThrow('Request failed with status code 401');
  });
});
