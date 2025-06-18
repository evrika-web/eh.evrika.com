const mongoose = require('mongoose');

const promoFormCfoSchema = new mongoose.Schema({
  FIO: { type: String, required: false },
  phone: { type: String, required: false },
  email: { type: String, required: false },
  city: { type: String, required: false },
}, { collection: 'promo_form_cfo' });

module.exports = mongoose.model('promo_form_cfo', promoFormCfoSchema);