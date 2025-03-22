// models/Tournament.js
const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  playerA: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  playerB: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scoreA: { type: Number, default: null },
  scoreB: { type: Number, default: null },
  confirmedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['pending', 'confirmed'], default: 'pending' }
});

const tournamentSchema = new mongoose.Schema({
  players: [
    { userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, username: String }
  ],
  matches: [matchSchema],
  status: { type: String, enum: ['pending', 'in-progress', 'finished'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
