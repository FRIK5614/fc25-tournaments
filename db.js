// db.js
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.NODE_ENV === 'test'
  ? 'mongodb://localhost:27018/fc25_tournaments'
  : process.env.MONGODB_URI;

mongoose.connect(uri, {
  // Эти опции устарели в драйвере 4.x, но не влияют на подключение
})
  .then(() => console.log(`✅ Connected to MongoDB at ${uri}`))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = mongoose;
