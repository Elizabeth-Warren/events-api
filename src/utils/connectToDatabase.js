const mongodb = require('mongodb');
const EventModel = require('../models/Event');

const mongodb_uri = process.env.MONGODB_URI || 'mongodb://mongo:27017';

let cachedClient = null;
let cachedDb = null;

const setupDatabase = () => {
  return new Promise((resolve, reject) => {
    connectToDatabase().then(initDatabase().then(resolve, reject));
  });
}

const connectToDatabase = () => {
  return new Promise((resolve, reject) => {
    if (cachedDb && cachedDb.serverConfig.isConnected()) {
      return resolve(cachedDb);
    }

    cachedClient = new mongodb.MongoClient(
      mongodb_uri,
      { useNewUrlParser: true },
    );

    cachedClient.connect((error) => {
      if (error) {
        console.error(error);
        return reject();
      }

      cachedDb = cachedClient.db('application');
      resolve(cachedDb);
    });
  });
}

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    const Event = EventModel(cachedDb);
    Event.init().then(() => resolve(cachedDb));
  });
}

const closeDatabaseConnection = () => {
  return cachedClient.close();
}

module.exports = {
  setupDatabase,
  connectToDatabase,
  initDatabase,
  closeDatabaseConnection
};
