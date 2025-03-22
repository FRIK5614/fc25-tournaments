const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MatchSchema = new Schema({
  playerA: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  playerB: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scoreA: { type: Number, default: 0 },
  scoreB: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'disputed'], default: 'pending' },
  confirmedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  dispute: {
    filedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    createdAt: Date
  }
});

const TournamentSchema = new Schema({
  players: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  matches: [MatchSchema],
  status: { type: String, enum: ['pending', 'in-progress', 'finished', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  finishedAt: { type: Date },
  winner: { type: Schema.Types.ObjectId, ref: 'User' } // Поле для хранения победителя турнира
});

module.exports = mongoose.model('Tournament', TournamentSchema);
