const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username:      { type: String, required: true },
  email:         { type: String, required: true, unique: true },
  phone:         { type: String, required: true },
  country:       { type: String, required: true },
  platform:      { type: String, required: true },
  gamertag:      { type: String, required: true },
  password:      { type: String, required: true },
  rating:        { type: Number, default: 1000 },
  role:          { type: String, enum: ['player','moderator','security','admin'], default: 'player' },
  friends:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  referralCode:  { type: String, unique: true },
  referredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  referredBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  telegramId:    { type: String },
  vkId:          { type: String },
  isVerified:    { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  phoneVerificationCode: { type: String },
  phoneVerificationExpires: { type: Date },
  avatar:        { type: String }
}, { timestamps: true });

userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
