const { framework, router } = require('@ewarren/serverless-routing');
const mongodb = require('mongodb');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const app = framework({ basePath: '/:stage-events' });
const EventModel = require('models/Event');

let cachedDb = null;

function connectToDatabase() {

  return new Promise((resolve, reject) => {
    if (cachedDb && cachedDb.serverConfig.isConnected()) {
      return resolve(cachedDb);
    }

    const databaseClient = new mongodb.MongoClient(
      process.env.MONGODB_URI,
      { useNewUrlParser: true },
    );

    databaseClient.connect((error) => {
      if (error) {
        console.error(error);
        return reject();
      }

      const db = databaseClient.db('application');

      // TODO(Jason Katz-Brown) Don't duplicate this code across connectToDatabase()
      const Event = EventModel(testDb);
      Event.init();

      cachedDb = db;
      return resolve(db);
    });
  });
}

require('./routes/events')({
  app, s3,
});

module.exports.router = router(app);
