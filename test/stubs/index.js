const mongodb = require('mongodb');
const EventModel = require('../../src/models/Event');
const { MongoMemoryServer } = require('mongodb-memory-server-core');

// TODO(Jason Katz-Brown) reset the DB between tests?
let testDb = null;

const connectToTestDatabase = () => {
  return new Promise(async (resolve, reject) => {
    if (testDb && testDb.serverConfig.isConnected()) {
      return resolve(testDb);
    }

    console.log(`INSIDE connect to test db promise resolve ${resolve}`);
    const mongod = new MongoMemoryServer();
    const uri = await mongod.getConnectionString();
    const port = await mongod.getPort();
    const dbPath = await mongod.getDbPath();
    const dbName = await mongod.getDbName();
    const databaseClient = new mongodb.MongoClient(
      uri,
      { useNewUrlParser: true },
    );

    databaseClient.connect((error) => {
      if (error) {
        console.error(error);
        return reject();
      }

      testDb = databaseClient.db('application');

      // TODO(Jason Katz-Brown) Don't duplicate this code across connectToDatabase()
      const Event = EventModel(testDb);
      Event.init();

      console.log(`returning resolve(${testDb})`);
      return resolve(testDb);
    });
  });
}

const mockAwsPromise = (returnValue) => () => ({ promise: async () => (returnValue) });

const s3ify = (value) => Buffer.from(JSON.stringify(JSON.stringify(value)));

module.exports = {
  connectToTestDatabase,
  testDb,
  mockAwsPromise,
  s3ify,
};
