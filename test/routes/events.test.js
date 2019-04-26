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

  before(function(done) {
    connectToDatabase().then((db) => {
      testDb = db;
      MockDate.set(new Date('2019-04-22'));
      (new DatabaseCleaner('mongodb')).clean(testDb, () => {
        initDatabase().then(() => {
          testDb.collection('events').insertMany(testEvents).then(() => { done() });
        });
      });
    });

    const app = framework({ basePath: '/:stage-events-v2' });
    eventsRoutes(app);
    onRequest = router(app);
  });

  after(closeDatabaseConnection);

  it('returns the latest events in temporal order', function(done) {
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
      assert.equal(new Date(events[0].date).getTimezoneOffset(), 0);

      done();
    });
  });

  it('returns nearby events in proximity order', function(done) {
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
