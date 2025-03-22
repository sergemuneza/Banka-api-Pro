import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // ✅ Load environment variables

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI; // ✅ Ensure MONGO_URI is loaded
    if (!mongoURI) {
      throw new Error("MONGO_URI is missing in environment variables");
    }

    await mongoose.connect(mongoURI);

    console.log("✅ MongoDB Connected...");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
