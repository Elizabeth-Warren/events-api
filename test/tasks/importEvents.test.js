const { assert } = require('chai');
const {
  connectToDatabase,
  initDatabase,
  closeDatabaseConnection
} = require('../../src/utils/connectToDatabase');
// const DatabaseCleaner = require('database-cleaner');
const importEvents = require('../../src/tasks/importEvents');
const testEvents = require('../fixtures/events');

describe('importEvents task', function() {
  let testDb = null;

  before(async function() {
    try {
      // console.log('[Before]');

      testDb = await connectToDatabase();

      await initDatabase();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

  after(async function() {
    try {
      // console.log('[After]');

      await closeDatabaseConnection();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

  // function wait(ms) {
  //   return new Promise((resolve) => {
  //     setTimeout(resolve, ms);
  //   });
  // }

  it('imports events', async function() {
    // console.log('[Test] - before wait');
    // await wait(1000);
    // console.log('[Test] - after wait');

    await importEvents();
    const collection = testDb.collection('events');
    const eventsCursor = await collection.find().sort( { startTime: 1 } );
    const allEvents = await eventsCursor.toArray();

    console.log("Got events:");
    console.log(allEvents);

    assert.isAbove(allEvents.length, 0);
  });
});
