const mongoose = require("mongoose");

const dbconnect = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/campusExchange", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error(" Database connection error:", err);
    process.exit(1);
  }
};

module.exports = dbconnect;