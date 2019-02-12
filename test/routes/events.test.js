const { assert } = require('chai');
const { HttpError, framework, router } = require('@ewarren/serverless-routing');
const { mockAwsPromise } = require('../stubs');
const eventsRoutes = require('../../src/routes/events');

describe('test upcoming events route', function() {
  it('should return the latest events in order', function(callback) {
    const testStub = {
      getObject: mockAwsPromise(),
    };

    const app = framework({ basePath: '/events' });
    eventsRoutes({ app, s3: testStub });
    const onRequest = router(app);

    onRequest({
      httpMethod: 'post',
      path: '/pz/location',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1 }),
      requestContext: {
        identity: { sourceIp: '127.0.0.1' },
      },
    }, {}, (err, response) => {
      assert.equal(response.statusCode, 200);
      assert.equal(JSON.parse(response.body).visitor.id, 1);

      callback();
    });
  });
});

describe('test nearby events route', function() {

});
