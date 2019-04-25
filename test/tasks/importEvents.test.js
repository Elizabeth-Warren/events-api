const { assert } = require('chai');
const {
  connectToDatabase,
  initDatabase,
  closeDatabaseConnection
} = require('../../src/utils/connectToDatabase');
const DatabaseCleaner = require('database-cleaner');
const nock = require('nock');
const importEvents = require('../../src/tasks/importEvents');
const testEvents = require('../fixtures/events');

describe('importEvents task', function() {
  let testDb = null;

  before(async function() {
    return new Promise(async resolve => {
      testDb = await connectToDatabase();
      resolve(testDb);
      new DatabaseCleaner('mongodb').clean(testDb, () => {
        initDatabase().then(resolve);
      });
    });
  });

  after(closeDatabaseConnection);

  async function populatePreexistingEvents(collection) {
    const preexistingEvents = [
      // This first event is obsolete and will be deleted.
      {
        mobilizeId: 1234,
        loc: { type: 'Point', coordinates: [-93.8549133, 41.6157869] },
        title: {
          'en-US': 'Old obsolete event',
          'es-MX': 'Old obsolete event',
        },
        published: true,
        startTime: new Date(1546610400 * 1000),  // Friday, January 4, 2019 9:00 AM
        endTime: new Date(1546610400 * 1000),
        timezone: 'America/Chicago',
        publicAddress: '1025 E Hickman Rd, Waukee IA 50263',
        city: 'Waukee',
        state: 'IA',
        zipcode: '50263',
        rsvpLink: 'https://events.elizabethwarren.com/event/1234/',
        rsvpCtaOverride: null,
        highPriority: false,
      },
      // This event will be updated with a new title.
      {
        mobilizeId: 909804,
        loc: { type: 'Point', coordinates: [-91.1281814, 41.7687331] },
        title: {
          'en-US': 'Tummytown Meet & Greet with Elizabeth Warren',
          'es-MX': 'Tummytown Meet & Greet with Elizabeth Warren',
        },
        published: true,
        startTime: new Date(1556297100 * 1000),  // Friday, April 26, 2019 12:45 EDT
        endTime: new Date(1556300700 * 1000),
        timezone: 'America/Chicago',
        venue: 'Tipton Family Restaurant',
        publicAddress: '101 E 4th St., Tipton, IA 52772',
        city: 'Tipton',
        state: 'IA',
        zipcode: '52772',
        rsvpLink: 'https://events.elizabethwarren.com/event/90980/',
        rsvpCtaOverride: null,
        highPriority: true,
      }
    ];

    return collection.insertMany(preexistingEvents);
  }

  async function mockMobilizeAmericaRequests() {
    const mobilizeAmericaBase = 'https://api.mobilize.us';
    nock(mobilizeAmericaBase)
      .get('/v1/organizations/1316/promoted_organizations')
      .reply(200, require('../fixtures/mobilizeamerica/promoted_organizations.json'));
    nock(mobilizeAmericaBase)
      .get('/v1/organizations/1310/events?timeslot_start=gte_now')
      .reply(200, require('../fixtures/mobilizeamerica/1310-1.json'));
    nock(mobilizeAmericaBase)
      .get('/v1/organizations/1310/events?page=2&timeslot_start=gte_now')
      .reply(200, require('../fixtures/mobilizeamerica/1310-2.json'));
    nock(mobilizeAmericaBase)
      .get('/v1/organizations/1310/events?page=3&timeslot_start=gte_now')
      .reply(200, require('../fixtures/mobilizeamerica/1310-3.json'));
    nock(mobilizeAmericaBase)
      .get('/v1/organizations/1361/events?timeslot_start=gte_now')
      .reply(200, require('../fixtures/mobilizeamerica/1361-1.json'));
    nock(mobilizeAmericaBase)
      .get('/v1/organizations/1416/events?timeslot_start=gte_now')
      .reply(200, require('../fixtures/mobilizeamerica/1416-1.json'));
    nock(mobilizeAmericaBase)
      .get('/v1/organizations/1360/events?timeslot_start=gte_now')
      .reply(200, require('../fixtures/mobilizeamerica/1360-1.json'));
  }

  it('imports events', async function() {
    const collection = await testDb.collection('events');
    await populatePreexistingEvents(collection);
    await mockMobilizeAmericaRequests();

    await importEvents();

    const updatedEvent = await collection.findOne({ mobilizeId: 90980 });
    assert.equal(updatedEvent.title['en-US'], 'Tipton Meet & Greet with Elizabeth Warren');

    obsoleteEventExists = await collection.count({ mobilizeId: 1234 })
    assert.equal(obsoleteEventExists, 0);

    const eventsCursor = await collection.find().sort( { startTime: 1 } );
    const allEvents = await eventsCursor.toArray();
    assert.equal(allEvents.length, 71);
  });
});
