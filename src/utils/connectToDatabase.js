const mongodb = require('mongodb');
const EventModel = require('../models/Event');

let cachedClient = null;
let cachedDb = null;

const connectToDatabase = () => {
  return new Promise((resolve, reject) => {
    if (cachedDb && cachedDb.serverConfig.isConnected()) {
      return resolve(cachedDb);
    }

    cachedClient = new mongodb.MongoClient(
      process.env.MONGODB_URI,
      { useNewUrlParser: true },
    );

    cachedClient.connect((error) => {
      if (error) {
        console.error(error);
        return reject();
      }

      const db = cachedClient.db('application');

      // TODO(Jason Katz-Brown) Don't duplicate this code across connectToDatabase()
      const Event = EventModel(db);
      Event.init();

      cachedDb = db;
      return resolve(db);
    });
  });
}

const closeDatabaseConnection = () => {
  cachedClient.close();
}

module.exports = {
  connectToDatabase,
  closeDatabaseConnection
};
