// models/Complaint.js
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  complainant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  matchId: { type: String }, // опционально, если нужен ID матча
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
