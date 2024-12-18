const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
    _id: Number,
    name: String,
    guid: String,
}, { strict: false });

const City = mongoose.model('City', citySchema, 'cities');

module.exports = City;