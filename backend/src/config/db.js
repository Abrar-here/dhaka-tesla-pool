const mongoose = require("mongoose");

async function connectDB(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log(`[db] connected to MongoDB`);
  return mongoose.connection;
}

module.exports = { connectDB };
