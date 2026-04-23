const mongoose = require("mongoose");

async function connectDb() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ams_with_ejs";

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = {
  connectDb,
};
