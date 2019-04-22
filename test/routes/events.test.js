const { assert } = require('chai');
const { HttpError, framework, router } = require('@ewarren/serverless-routing');
const { mockAwsPromise, s3ify } = require('../stubs');
const { connectToDatabase, closeDatabaseConnection } = require('../../src/utils/connectToDatabase');
const DatabaseCleaner = require('database-cleaner');
const eventsRoutes = require('../../src/routes/events');

describe('test upcoming events route using Mongo', function() {
  let testDb = null;

  before(function(done) {
    connectToDatabase().then((db) => {
      testDb = db;
      (new DatabaseCleaner('mongodb')).clean(testDb, done)
    });
  });

  after(function() {
    closeDatabaseConnection();
  });

  it('should return the latest events in order', function(done) {
    const collection = testDb.collection('events');
    // TODO Use a proper fixtures library? And flesh out with real test data.
    collection.insertOne({
      location: { type: 'Point', coordinates: [ -73.97, 40.77 ] },
      title: 'Keene Organizing Event',
      published: true,
      date: Date.now() + (1000 * 60 * 60 * 24),
    });

    const app = framework({ basePath: '/:stage-events' });
    eventsRoutes({ app, connectToDatabase });
    const onRequest = router(app);

    onRequest({
      httpMethod: 'get',
      path: '/prod-events/upcoming',
      queryStringParameters: {
        source: 'mongodb',
      },
      headers: { 'Content-Type': 'application/json' },
    }, {}, (err, response) => {
      assert.equal(response.statusCode, 200);
      events = JSON.parse(response.body).events;
      console.log("Got events:");
      console.log(JSON.stringify(events));
      assert.equal(events.length, 1);
      assert.equal(events[0].title, 'Keene Organizing Event');
      assert.equal(new Date(events[0].date).getTimezoneOffset(), 0);

      done();
    });
  });
});

describe('test upcoming events route', function() {
  it('should return the latest events in order', function(callback) {
    const testStub = {
      getObject: mockAwsPromise({
        Body: s3ify({
          data: [
            {
              'Event Title (US-EN)': '1',
              'Published': true,
              'Date': Date.now() + (1000 * 60 * 60 * 24),
            },
            {
              'Event Title (US-EN)': '2',
              'Published': true,
              'Date': Date.now() + (1000 * 60 * 60 * 24 * 2),
            },
          ],
        }),
      }),
    };

    const app = framework({ basePath: '/:stage-events' });
    eventsRoutes({ app, s3: testStub });
    const onRequest = router(app);

    onRequest({
      httpMethod: 'get',
      path: '/prod-events/upcoming',
      headers: { 'Content-Type': 'application/json' },
    }, {}, (err, response) => {
      assert.equal(response.statusCode, 200);
      assert.equal(JSON.parse(response.body).events[0].title['en-US'], '1');
      assert.equal(JSON.parse(response.body).events[1].title['en-US'], '2');
      assert.equal(new Date(JSON.parse(response.body).events[0].date).getTimezoneOffset(), 0);

      callback();
    });
  });
});

describe('test nearby events route', function() {
  it('should return the latest events in order', function(callback) {
    const testStub = {
      getObject: mockAwsPromise({
        Body: s3ify({
          data: [
            {
              'Event Title (US-EN)': '1',
              'Published': true,
              'Date': Date.now() + (1000 * 60 * 60 * 24),
              'Longitude': -74.005974,
              'Latitude': 40.712776,
            },
            {
              'Event Title (US-EN)': '2',
              'Published': true,
              'Date': Date.now() + (1000 * 60 * 60 * 24 * 2),
              'Longitude': -74.011424,
              'Latitude': 40.705857,
            },
            {
              'Event Title (US-EN)': '3',
              'Published': true,
              'Date': Date.now() + (1000 * 60 * 60 * 24 * 2),
            },
          ],
        }),
      }),
    };

    const app = framework({ basePath: '/:stage-events' });
    eventsRoutes({ app, s3: testStub });
    const onRequest = router(app);

    onRequest({
      httpMethod: 'get',
      path: '/prod-events/nearby',
      queryStringParameters: {
        lat: '40.730597',
        lon: '-73.997439',
      },
      headers: { 'Content-Type': 'application/json' },
    }, {}, (err, response) => {
      assert.equal(response.statusCode, 200);
      assert.equal(JSON.parse(response.body).events[0].title['en-US'], '1');
      assert.equal(JSON.parse(response.body).events[1].title['en-US'], '2');
      assert.isUndefined(JSON.parse(response.body).events[2]);

      callback();
    });
  });
});
