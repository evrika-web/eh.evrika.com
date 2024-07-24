const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    parent_id: { type: Number, required: false },
    menu_icon: { type: String, required: false },
    menu_banner_url: { type: String, required: false },
    menu_banner_name: { type: String, required: false },
    menu_banner_image: { type: String, required: false }
}, { collection: 'categories' }); // Укажите имя коллекции, если оно отличается от имени модели

module.exports = mongoose.model('Category', categorySchema);
