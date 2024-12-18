const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    _id: Number,
    name: String,
    guid: String,
    city_id:  {
        type: Number,
        ref: 'City'  // Ссылка на другую коллекцию для использования populate
    },
}, { strict: false });

const Branch = mongoose.model('Branch', branchSchema, 'branches');

module.exports = Branch;