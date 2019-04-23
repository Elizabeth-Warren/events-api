const { assert } = require('chai');
const { HttpError, framework, router } = require('@ewarren/serverless-routing');
const { mockAwsPromise, s3ify } = require('../stubs');
const { connectToDatabase, closeDatabaseConnection } = require('../../src/utils/connectToDatabase');
const DatabaseCleaner = require('database-cleaner');
const eventsRoutes = require('../../src/routes/events');

describe('test upcoming events route using Mongo', function() {
  let testDb = null;

  const testEvents = [{
    location: { type: 'Point', coordinates: [-93.8549133, 41.6157869] },
    title: 'Waukee for Warren Coffee Hours',
    published: true,
    date: new Date(1556114400),
    startTime: new Date(1556114400),
    endTime: new Date(1556125200),
    timezone: 'America/Chicago',
    publicAddress: '1025 E Hickman Rd, Waukee IA 50263',
    city: 'Waukee',
    state: 'IA',
    zipcode: '50263',
    rsvpLink: 'https://events.elizabethwarren.com/event/88773/',
    rsvpCtaOverride: null,
  }, {
    location: null,
    title: 'Salem Community Meeting',
    published: true,
    date: new Date(1556395200),
    startTime: new Date(1556395200),
    endTime: new Date(1556402400),
    timezone: 'America/New_York',
    publicAddress: 'Salem, NH 03079',
    city: 'Salem',
    state: 'NH',
    zipcode: '03079',
    rsvpLink: 'https://events.elizabethwarren.com/event/90805/',
    rsvpCtaOverride: null,
  }, {
    location: { type: 'Point', coordinates: [-71.0953117, 42.326097] },
    title: 'Win with Warren Party Roxbury',
    published: true,
    date: new Date(1557077400),
    startTime: new Date(1557077400),
    endTime: new Date(1557086400),
    timezone: 'America/New_York',
    publicAddress: 'Fort Ave, Boston MA 02119',
    city: 'Boston',
    state: 'MA',
    zipcode: '02119',
    rsvpLink: 'https://events.elizabethwarren.com/event/89109/',
    rsvpCtaOverride: null,
  }];

  before(function(done) {
    connectToDatabase().then((db) => {
      testDb = db;
      (new DatabaseCleaner('mongodb')).clean(testDb, () => {
        testDb.collection('events').insertMany(testEvents).then(() => { done() });
      });
    });
  });

  after(function() {
    closeDatabaseConnection();
  });

  it.only('should return the latest events in order', function(done) {
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
      assert.equal(events.length, 3);
      assert.equal(events[0].title, 'Win with Warren Party Roxbury');
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
