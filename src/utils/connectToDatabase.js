const mongodb = require('mongodb');
const EventModel = require('../models/Event');

const mongodb_uri = process.env.MONGODB_URI || 'mongodb://mongo:27017';

let cachedClient = null;
let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb && cachedDb.serverConfig.isConnected()) {
    return cachedDb;
  }

  cachedClient = new mongodb.MongoClient(
    mongodb_uri,
    { useNewUrlParser: true },
  );

  await cachedClient.connect();
  cachedDb = await cachedClient.db('application');
  return cachedDb;
}

const initDatabase = async () => {
  const Event = EventModel(cachedDb);
  return Event.init();
}

const setupDatabase = async () => {
  await connectToDatabase();
  await initDatabase();
  return cachedDb;
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
