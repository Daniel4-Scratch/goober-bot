const { MongoClient, ServerApiVersion } = require('mongodb');
const mongodb_user = process.env.mongodb_user;
const mongodb_pass = process.env.mongodb_pass;
const uri = `mongodb+srv://${mongodb_user}:${mongodb_pass}@goober.ffhkl3d.mongodb.net/?retryWrites=true&w=majority&appName=Goober`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db = null;

async function connect() {
  if (!db) {
    await client.connect();
    db = client.db('goober-bot'); // Change 'goober' to your database name if different
  }
  return db;
}

//check if database is online
async function isDatabaseOnline() {
  try {
    await client.db('goober-bot').command({ ping: 1 });
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

function getCollection(name) {
  if (!db) throw new Error('Database not connected. Call connect() first.');
  return db.collection(name);
}

async function close() {
  await client.close();
  db = null;
}

module.exports = {
  connect,
  getCollection,
  close,
  isDatabaseOnline
};



