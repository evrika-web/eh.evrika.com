// models/Product.js

const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Подсхема для локаций (складов)
const LocationSchema = new Schema({
  id: {
    type: String,
    required: true,
    ref: 'Location' // Ссылка на коллекцию Location, если такая имеется
  },
  stock_quantity: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Подсхема для бейджей
const BadgeSchema = new Schema({
  id: {
    type: Number,
    required: true
  },
  sort: {
    type: Number,
    default: 0
  },
  published: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    match: /^#([0-9A-F]{3}){1,2}$/i // Проверка формата HEX цвета
  },
  name: {
    type: String,
    required: true
  }
}, { _id: false });

// Подсхема для спецификаций
const SpecSchema = new Schema({
  value: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  priority: {
    type: Number,
    default: 0
  },
  specid: {
    type: Number,
    required: true,
    ref: 'Spec' // Ссылка на коллекцию Spec, если такая имеется
  },
  specsort: {
    type: Number,
    default: 0
  },
  specslug: {
    type: String,
    required: true
  },
  valueid: {
    type: Number,
    required: true,
    ref: 'SpecValue' // Ссылка на коллекцию SpecValue, если такая имеется
  },
  valueslug: {
    type: String,
    required: true
  },
  valuesort: {
    type: Number,
    default: 0
  }
}, { _id: false });

const ProductSchema = new Schema({
  _id: {
    type: Number, // Указываем, что _id является числом
    required: true
  },
  url: {
    type: String,
    required: true,
    unique: true,
    match: /^https?:\/\/.+/ // Простая валидация URL
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  oldprice: {
    type: Number,
    default: 0,
    min: 0
  },
  currencyId: {
    type: String,
    required: true,
    enum: ['KZT', 'USD', 'EUR', 'RUB'] // Добавьте другие валюты по необходимости
  },
  categoryId: {
    type: Number,
    required: true,
    ref: 'Category' // Ссылка на коллекцию Category
  },
  picture: {
    type: String,
    required: true,
    match: /^https?:\/\/.+/ // Проверка формата URL изображения
  },
  name: {
    type: String,
    required: true,
    index: true // Индекс для быстрого поиска по имени
  },
  brandId: {
    type: Number,
    required: true,
    ref: 'Brand' // Ссылка на коллекцию Brand
  },
  guid: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  installment: {
    type: Number,
    default: 0,
    min: 0
  },
  vendor: {
    type: String,
    required: true
  },
  vendorCode: {
    type: String,
    required: true,
    unique: true
  },
  locations: {
    type: [LocationSchema],
    default: []
  },
  badges: {
    type: [BadgeSchema],
    default: []
  },
  available: {
    type: Boolean,
    default: true,
    index: true
  },
  gifts: {
    type: [Schema.Types.Mixed], // Используйте более конкретный тип при необходимости
    default: []
  },
  specs: {
    type: [SpecSchema],
    default: []
  },
  updated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Добавляет createdAt и updatedAt поля
});

// Индексы для оптимизации запросов
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ brandId: 1 });
ProductSchema.index({ "specs.specid": 1, "specs.valueid": 1 });
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ name: "text", description: "text" }); // Добавьте поле description, если оно существует

// Экспорт модели
module.exports = mongoose.model('products', ProductSchema);
