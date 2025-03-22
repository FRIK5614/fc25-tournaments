const AuditLog = require('../models/AuditLog');

async function logEvent(userId, action, details, ip) {
  try {
    const log = new AuditLog({
      userId,
      action,
      details,
      ip
    });
    await log.save();
  } catch (err) {
    console.error('Ошибка записи аудита:', err);
  }
}

module.exports = { logEvent };
