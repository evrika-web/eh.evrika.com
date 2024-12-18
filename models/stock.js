const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
    branch: String,  // Можно указывать только нужные поля
    category: String,
    quantity: Number,
    product_guid: String,
    branch_guid: String,
}, { strict: false });  // strict: false позволяет добавлять в базу любые поля, даже если они не указаны в схеме

// Виртуальное поле для связи по branch_guid
stockSchema.virtual('branchKey', {
    ref: 'Branch',           // Имя модели
    localField: 'branch_guid',  // Поле в Stock
    foreignField: 'guid',     // Поле в Branch для связи
    justOne: true             // Указывает, что ожидается только один документ
});

// Виртуальное поле для связи по branch_guid
stockSchema.virtual('productKey', {
    ref: 'Product',           // Имя модели
    localField: 'product_guid',  // Поле в Stock
    foreignField: 'guid',     // Поле в Branch для связи
    justOne: true             // Указывает, что ожидается только один документ
});

// Добавление виртуальных полей в JSON-вывод
stockSchema.set('toObject', { virtuals: true });
stockSchema.set('toJSON', { virtuals: true });

const Stock = mongoose.model('Stock', stockSchema,'stocks');

module.exports = Stock;
