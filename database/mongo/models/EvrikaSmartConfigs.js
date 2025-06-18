const mongoose = require('mongoose');

const smartConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }
    // остальные поля динамические
  },
  { collection: 'evrika-smart-configs', strict: false }
);

module.exports = mongoose.model('evrika-smart-configs', smartConfigSchema);