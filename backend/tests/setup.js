const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongoServer;

// Runs once before all test files that import this setup.
async function connectTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

// Clears all collections between individual tests, so tests don't leak
// state into each other, without paying the cost of a fresh DB each time.
async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

async function disconnectTestDB() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}

module.exports = { connectTestDB, clearTestDB, disconnectTestDB };
