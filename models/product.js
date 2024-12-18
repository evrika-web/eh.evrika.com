const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    _id: Number,
    name: String,  // Можно указывать только нужные поля
    published: Boolean,  
    category: String,
    brandId: {
        type: Number,
        ref: 'Branch'  // Ссылка на другую коллекцию для использования populate
    }
}, { strict: false });  // strict: false позволяет добавлять в базу любые поля, даже если они не указаны в схеме

const Product = mongoose.model('Product', productSchema, 'products');

module.exports = Product;
