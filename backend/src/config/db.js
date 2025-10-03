const connectDB = async (mongoUri) => {
  try {
    // try to connect to Mongo
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
  } catch (err) {
    // if connection fails
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};



