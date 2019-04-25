const { assert } = require('chai');
const {
  connectToDatabase,
  initDatabase,
  closeDatabaseConnection
} = require('../../src/utils/connectToDatabase');
const DatabaseCleaner = require('database-cleaner');
const importEvents = require('../../src/tasks/importEvents');
const testEvents = require('../fixtures/events');

describe('importEvents task', function() {
  let testDb = null;

  before(function(done) {
    connectToDatabase().then((db) => {
      testDb = db;
      (new DatabaseCleaner('mongodb')).clean(testDb, () => {
        initDatabase().then(done());
      });
    });
  });

  after(function() {
    console.log("closeDatabaseConnection()");
    // TODO URRRRR what's going on -- why 
    closeDatabaseConnection();
  });

  it('imports events', async () => {
    await importEvents();
    const collection = testDb.collection('events');
    const eventsCursor = await collection.find().sort( { startTime: 1 } );
    const allEvents = await eventsCursor.toArray();
    console.log("Got events:");
    console.log(allEvents);
    assert.isAbove(allEvents.length, 0);
  });
});
