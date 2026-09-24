const { MongoClient } = require('mongodb');

const databaseName = 'TEDX';
const collectionName = 'Team_Details';
const adminCollectionName = 'Admin_Credentials';
const siteSettingsCollectionName = 'Site_Settings';
let client;
let database;

async function connectToDatabase() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set in backend/.env');
  }

  client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  database = client.db(databaseName);
  console.log(`Connected to MongoDB database ${databaseName}`);
}

async function getTeamCollection() {
  if (!database) await connectToDatabase();
  return database.collection(collectionName);
}

async function getAdminCollection() {
  if (!database) await connectToDatabase();
  return database.collection(adminCollectionName);
}

async function getSiteSettingsCollection() {
  if (!database) await connectToDatabase();
  return database.collection(siteSettingsCollectionName);
}

module.exports = {
  connectToDatabase,
  getTeamCollection,
  getAdminCollection,
  getSiteSettingsCollection,
};