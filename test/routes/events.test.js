const { assert } = require('chai');
const { HttpError, framework, router } = require('@ewarren/serverless-routing');
const {
  connectToDatabase,
  initDatabase,
  closeDatabaseConnection
} = require('../../src/utils/connectToDatabase');
const DatabaseCleaner = require('database-cleaner');
const eventsRoutes = require('../../src/routes/events');

describe('test upcoming events route using Mongo', function() {
  let onRequest = null;
  let testDb = null;

  const testEvents = [{
    loc: { type: 'Point', coordinates: [-93.8549133, 41.6157869] },
    title: 'Waukee for Warren Coffee Hours',
    published: true,
    date: new Date(1556114400),
    startTime: new Date(1556114400),  // April 24, 2019 10:00 AM EDT
    endTime: new Date(1556125200),
    timezone: 'America/Chicago',
    publicAddress: '1025 E Hickman Rd, Waukee IA 50263',
    city: 'Waukee',
    state: 'IA',
    zipcode: '50263',
    rsvpLink: 'https://events.elizabethwarren.com/event/88773/',
    rsvpCtaOverride: null,
  }, {
    loc: null,
    title: 'Salem Community Meeting',
    published: true,
    date: new Date(1556395200),
    startTime: new Date(1556395200),  // Saturday, April 27, 2019 4:00 PM EDT
    endTime: new Date(1556402400),
    timezone: 'America/New_York',
    publicAddress: 'Salem, NH 03079',
    city: 'Salem',
    state: 'NH',
    zipcode: '03079',
    rsvpLink: 'https://events.elizabethwarren.com/event/90805/',
    rsvpCtaOverride: null,
  }, {
    loc: { type: 'Point', coordinates: [-71.6080009, 42.2638905] },
    title: 'Win with Warren Party MetroWest',
    published: true,
    date: new Date(1556319600),
    startTime: new Date(1556319600),  // April 26, 2019 7:00 PM EDT
    endTime: new Date(1556326800),
    timezone: 'America/New_York',
    publicAddress: 'Westborough, MA 01581',
    city: 'Westborough',
    state: 'MA',
    zipcode: '01581',
    rsvpLink: 'https://events.elizabethwarren.com/event/88931/',
    rsvpCtaOverride: null,
  }, {
    loc: { type: 'Point', coordinates: [-71.0953117, 42.326097] },
    title: 'Win with Warren Party Roxbury',
    published: true,
    date: new Date(1557077400),
    startTime: new Date(1557077400),  // May 5, 2019 1:30 PM EDT
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
        initDatabase().then(() => {
          testDb.collection('events').insertMany(testEvents).then(() => { done() });
        });
      });
    });

    const app = framework({ basePath: '/:stage-events' });
    eventsRoutes(app);
    onRequest = router(app);
  });

  after(function() {
    closeDatabaseConnection();
  });

  it('should return the latest events in temporal order', function(done) {
    onRequest({
      httpMethod: 'get',
      path: '/prod-events/upcoming',
      headers: { 'Content-Type': 'application/json' },
    }, {}, (err, response) => {
      assert.equal(response.statusCode, 200);
      events = JSON.parse(response.body).events;

      // Every event is returned, and the Iowa event is soonest.
      assert.equal(events.length, 4);
      assert.equal(events[0].title, 'Waukee for Warren Coffee Hours');
      assert.equal(new Date(events[0].date).getTimezoneOffset(), 0);

      done();
    });
  });

  it('should return nearby events in proximity order', function(done) {
    onRequest({
      httpMethod: 'get',
      path: '/prod-events/nearby',
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
      assert.equal(events[0].title, 'Win with Warren Party Roxbury');
      assert.equal(events[1].title, 'Win with Warren Party MetroWest');
      assert.equal(new Date(events[0].date).getTimezoneOffset(), 0);

      done();
    });
  });
});
