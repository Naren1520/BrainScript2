// server/src/utils/connectDB.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("⏳ Connecting to MongoDB...");
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: "majority",
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    console.error("⚠️  Server will continue without database. Features requiring DB will fail.");
    // Don't exit - let server start anyway so it can serve other endpoints
  }
};

export default connectDB;
