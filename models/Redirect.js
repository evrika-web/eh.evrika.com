// models/Redirect.js

const mongoose = require('mongoose');

const RedirectSchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    match: /^https?:\/\/.+/
  }
});

module.exports = mongoose.model('Redirect', RedirectSchema);
