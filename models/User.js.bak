// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username:   { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  phone:      { type: String, required: true },
  country:    { type: String, required: true },
  platform:   { type: String, required: true },
  gamertag:   { type: String, required: true },
  password:   { type: String, required: true }, // хранится хэш пароля
  rating:     { type: Number, default: 1000 },
  role:       { type: String, enum: ['player', 'moderator', 'security', 'admin'], default: 'player' },
  friends:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  referralCode: { type: String, unique: true },
  referredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Автоматическая генерация реферального кода, если он ещё не установлен
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    // Простой способ: генерируем случайный 6-символьный код
    this.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
