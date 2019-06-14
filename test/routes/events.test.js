const { assert } = require('chai');
const { HttpError, framework, router } = require('@ewarren/serverless-routing');
const {
  connectToDatabase,
  initDatabase,
  closeDatabaseConnection
} = require('../../src/utils/connectToDatabase');
const DatabaseCleaner = require('database-cleaner');
const MockDate = require('mockdate');
const eventsRoutes = require('../../src/routes/events');
const testEvents = require('../fixtures/events');

describe('events routes', function() {
  let onRequest = null;
  let testDb = null;

  beforeEach(function(done) {
    connectToDatabase().then((db) => {
      testDb = db;
      MockDate.set(new Date('2019-04-22'));
      (new DatabaseCleaner('mongodb')).clean(testDb, () => {
        initDatabase().then(() => { done() });
      });
    });

    const app = framework({ basePath: '/:stage-events-v2' });
    eventsRoutes(app);
    onRequest = router(app);
  });

  afterEach(closeDatabaseConnection);

  it('returns the latest events in temporal order', function(done) {
    testDb.collection('events').insertMany(testEvents).then(() => {
      onRequest({
        httpMethod: 'get',
        path: '/prod-events-v2/upcoming',
        headers: { 'Content-Type': 'application/json' },
      }, {}, (err, response) => {
        assert.equal(response.statusCode, 200);
        events = JSON.parse(response.body).events;

        // Every event is returned, and the Iowa event is soonest.
        assert.equal(events.length, 5);
        assert.equal(events[0].title['en-US'], 'Tipton Meet & Greet with Elizabeth Warren');
        assert.equal(events[1].title['en-US'], 'Waukee for Warren Coffee Hours');
        assert.equal(events[2].title['en-US'], 'Win with Warren Party MetroWest');
        assert.equal(events[3].title['en-US'], 'Salem Community Meeting');
        assert.equal(events[4].title['en-US'], 'Win with Warren Party Roxbury');
        assert.equal(new Date(events[0].date).getTimezoneOffset(), 0);

        done();
      });
    });
  });

  it('can return zero events', function(done) {
    onRequest({
      httpMethod: 'get',
      path: '/prod-events-v2/upcoming',
      headers: { 'Content-Type': 'application/json' },
    }, {}, (err, response) => {
      assert.equal(response.statusCode, 200);
      events = JSON.parse(response.body).events;

      // Every event is returned, and the Iowa event is soonest.
      assert.equal(events.length, 0);

      done();
    });
  });

  it('returns nearby events in proximity order', function(done) {
    testDb.collection('events').insertMany(testEvents).then(() => {
      onRequest({
        httpMethod: 'get',
        path: '/prod-events-v2/nearby',
        queryStringParameters: {
          lat: '42.382393',
          lon: '-71.077814',
        },
        headers: { 'Content-Type': 'application/json' },
      }, {}, (err, response) => {
        assert.equal(response.statusCode, 200);
        events = JSON.parse(response.body).events;

        // Iowa event is excluded; Salem event is close enough but does not have lat/long in DB.
        // Roxbury event is first because it's nearest.
        assert.equal(events.length, 2);
        assert.equal(events[0].title['en-US'], 'Win with Warren Party Roxbury');
        assert.equal(events[1].title['en-US'], 'Win with Warren Party MetroWest');
        assert.equal(new Date(events[0].date).getTimezoneOffset(), 0);

        done();
      });
    });
  });

  it('handles invalid zip', function(done) {
    testDb.collection('events').insertMany(testEvents).then(() => {
      onRequest({
        httpMethod: 'get',
        path: '/prod-events-v2/nearby',
        queryStringParameters: {
          zip: '00000',
        },
        headers: { 'Content-Type': 'application/json' },
      }, {}, (err, response) => {
        assert.equal(response.statusCode, 400);
        done();
      });
    });
  });

  it('returns nearby events to zip in proximity order', function(done) {
    testDb.collection('events').insertMany(testEvents).then(() => {
      onRequest({
        httpMethod: 'get',
        path: '/prod-events-v2/nearby',
        queryStringParameters: {
          zip: '02129',
        },
        headers: { 'Content-Type': 'application/json' },
      }, {}, (err, response) => {
        assert.equal(response.statusCode, 200);
        events = JSON.parse(response.body).events;

        assert.equal(events.length, 2);
        assert.equal(events[0].title['en-US'], 'Win with Warren Party Roxbury');
        assert.equal(events[1].title['en-US'], 'Win with Warren Party MetroWest');
        assert.equal(new Date(events[0].date).getTimezoneOffset(), 0);

        done();
      });
    });
  });

  it('returns upcoming high priority and nearby events', function(done) {
    testDb.collection('events').insertMany(testEvents).then(() => {
      onRequest({
        httpMethod: 'get',
        path: '/prod-events-v2/upcoming-high-priority-and-nearby',
        queryStringParameters: {
          lat: '42.382393',
          lon: '-71.077814',
        },
        headers: { 'Content-Type': 'application/json' },
      }, {}, (err, response) => {
        assert.equal(response.statusCode, 200);
        events = JSON.parse(response.body).events;

        assert.equal(events.length, 4);
        // High priority events ordered chronologically, then low-priority
        // events ordered by nearness.
        // Only returns events with a lat/lon (so the Salem one is missing).
        assert.equal(events[0].title['en-US'], 'Tipton Meet & Greet with Elizabeth Warren');
        assert.equal(events[1].title['en-US'], 'Win with Warren Party Roxbury');
        assert.equal(events[2].title['en-US'], 'Win with Warren Party MetroWest');
        assert.equal(events[3].title['en-US'], 'Waukee for Warren Coffee Hours');
        assert.equal(new Date(events[0].date).getTimezoneOffset(), 0);

        done();
      });
    });
  });
});
