// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },  // Например, "tournament", "complaint", "system"
  message: { type: String, required: true },
  status: { type: String, enum: ['unread', 'read'], default: 'unread' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
