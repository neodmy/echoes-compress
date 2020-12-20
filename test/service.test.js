const supertest = require('supertest');
const system = require('../system');

describe('Service Tests', () => {
  let request;
  const sys = system();

  beforeEach(async () => {
    const { app } = await sys.start();
    request = supertest(app);
  });

  afterEach(async () => {
    await sys.stop();
  });

  it('returns manifest', () => request
    .get('/__/manifest')
    .expect(200)
    .then(response => {
      expect(response.headers['content-type']).toEqual('application/json; charset=utf-8');
    }));
});
