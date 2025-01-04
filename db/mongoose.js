const mongoose = require('mongoose');
const logger = require('../config/logger');

// Add this line before connecting to handle the deprecation warning
mongoose.set('strictQuery', false);

// Connection URI - replace with your actual MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database';

// Connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Connect to MongoDB
mongoose.connect(MONGODB_URI, options)
  .then(() => logger.info('Successfully connected to MongoDB.'))
  .catch(err => logger.error('MongoDB connection error:', err));

// Export the mongoose connection
module.exports = mongoose.connection;

