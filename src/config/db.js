const mongoose = require("mongoose");

/**
 * MongoDB connection helper (reusable).
 * - Uses MONGODB_URI (MongoDB Atlas recommended).
 * - Keeps connection logic out of server/app bootstrap for clean architecture.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  mongoose.set("strictQuery", true);

  // Helpful startup logging (do NOT print credentials).
  // Example: mongodb+srv://user:***@cluster0.xxxxx.mongodb.net/db
  const redactedUri = uri.replace(/\/\/([^:]+):([^@]+)@/i, "//$1:***@");
  // eslint-disable-next-line no-console
  console.log("[db] Connecting to MongoDB:", redactedUri);

  await mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== "production"
  });

  // eslint-disable-next-line no-console
  console.log("[db] MongoDB connected:", {
    host: mongoose.connection.host,
    name: mongoose.connection.name
  });

  return mongoose.connection;
};

module.exports = { connectDB };
