const mongoose = require('mongoose');

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
    vendorCode: String,
    discount_percent: Number,
    locations: [
        {
            stock_quantity: Number,
            id: String
        }
    ],
    badges: Array,
    id: String,
    available: Boolean,
    gifts: Array,
    specs: [
        {
            value: String,
            name: String,
            code: String,
            color: String,
            specid: Number,
            specsort: Number,
            specslug: String,
            valueid: String,
            valueslug: String,
            valuesort: Number,
            specFilterGroup: String
        }
    ],
    mpn: String,
    updated: Date,
    sales: { type: Number, default: 0 }, // Количество продаж
    views: { type: Number, default: 0 }, // Количество просмотров
    rating: { type: Number, default: 0 }, // Рейтинг товара
    reviews: { type: Number, default: 0 }, // Количество отзывов
    popularity: { type: Number, default: 0 } // Поле популярности
}, { collection: 'products' });

productSchema.methods.updatePopularity = function () {
    // Пример логики расчета популярности на основе продаж, просмотров, рейтинга и отзывов
    this.popularity = this.sales * 2 + this.views * 1 + this.rating * 10 + this.reviews * 3;
    return this.save();
};

module.exports = mongoose.model('Product', productSchema);
