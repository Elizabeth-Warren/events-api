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

  const wait = ms => new Promise(resolve => {
    console.log('about to wait 5s');
    setTimeout(() => { console.log('done waiting 5s'); resolve() }, ms)
  });

  it('imports events', async function() {
    //await wait(5000);
    try {
      await importEvents();
      const collection = await testDb.collection('events');
      const eventsCursor = await collection.find().sort( { startTime: 1 } );
      const allEvents = await eventsCursor.toArray();
      console.log("Got events:");
      console.log(allEvents);
      assert.isAbove(allEvents.length, 0);
      console.log("Assert allEvents.length");
      await closeDatabaseConnection();
    } catch(e) {
      console.log('got error', e);
    }
  });
});
