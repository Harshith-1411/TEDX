const { MongoClient } = require('mongodb');

const databaseName = 'TEDX';
const collectionName = 'Team_Details';
const facultyCollectionName = 'Faculty Coordinator';
const adminCollectionName = 'Admin_Credentials';
const siteSettingsCollectionName = 'Site_Settings';
const footerCollectionName = 'Footer';
const sessionsCollectionName = 'Admin_Sessions';
const speakersCollectionName = 'Speakers';
let client;
let database;
let connecting;

async function connectToDatabase() {
  if (database) return database;

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set');
  }

  if (!connecting) {
    connecting = (async () => {
      client = new MongoClient(process.env.MONGO_URI);
      await client.connect();
      database = client.db(databaseName);
      console.log(`Connected to MongoDB database ${databaseName}`);
      return database;
    })().catch((error) => {
      connecting = null;
      throw error;
    });
  }

  await connecting;
  return database;
}

async function getTeamCollection() {
  if (!database) await connectToDatabase();
  return database.collection(collectionName);
}

async function getFacultyCollection() {
  if (!database) await connectToDatabase();
  return database.collection(facultyCollectionName);
}

async function getAdminCollection() {
  if (!database) await connectToDatabase();
  return database.collection(adminCollectionName);
}

async function getSiteSettingsCollection() {
  if (!database) await connectToDatabase();
  return database.collection(siteSettingsCollectionName);
}

async function getFooterCollection() {
  if (!database) await connectToDatabase();
  return database.collection(footerCollectionName);
}

async function getSessionsCollection() {
  if (!database) await connectToDatabase();
  return database.collection(sessionsCollectionName);
}

async function getSpeakersCollection() {
  if (!database) await connectToDatabase();
  return database.collection(speakersCollectionName);
}

module.exports = {
  connectToDatabase,
  getTeamCollection,
  getFacultyCollection,
  getAdminCollection,
  getSiteSettingsCollection,
  getFooterCollection,
  getSessionsCollection,
  getSpeakersCollection,
};
