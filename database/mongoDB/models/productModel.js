const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    stock_quantity: Number,
    id: String
});

const specSchema = new mongoose.Schema({
    value: String,
    name: String,
    code: String,
    specid: Number,
    specsort: Number,
    specslug: String,
    valueid: String,
    valueslug: String,
    valuesort: Number,
    specFilterGroup: String
});

const productSchema = new mongoose.Schema({
    url: String,
    price: Number,
    oldprice: Number,
    currencyId: String,
    categoryId: Number,
    picture: String,
    name: String,
    brandId: Number,
    guid: String,
    slug: String,
    installment: Number,
    vendor: String,
    vendorCode: Number,
    discount_percent: Number,
    locations: [locationSchema],
    badges: Array,
    id: String,
    available: Boolean,
    gifts: Array,
    specs: [specSchema],
    mpn: String,
    updated: Date
});

module.exports = mongoose.model('Product', productSchema);
