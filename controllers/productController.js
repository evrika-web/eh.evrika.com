const { ObjectId } = require('mongodb');

// Получить все продукты с фильтрацией
const getProducts = async (req, res) => {
    try {
        const filters = req.query;
        const filterCriteria = {};

        Object.keys(filters).forEach(key => {
            filterCriteria[`specs.${key}`] = filters[key];
        });

        const products = await req.db.collection('products').find(filterCriteria).toArray();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Получить продукт по ID
const getProductById = async (req, res) => {
    try {
        const product = await req.db.collection('products').findOne({ _id: ObjectId(req.params.id) });
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Создать новый продукт
const createProduct = async (req, res) => {
    const {
        url,
        price,
        oldprice,
        currencyId,
        categoryId,
        picture,
        name,
        brandId,
        guid,
        slug,
        installment,
        vendor,
        vendorCode,
        locations,
        badges,
        id,
        available,
        gifts,
        specs,
        updated,
    } = req.body;
    try {
        const product = {
            url,
            price,
            oldprice,
            currencyId,
            categoryId,
            picture,
            name,
            brandId,
            guid,
            slug,
            installment,
            vendor,
            vendorCode,
            locations,
            badges,
            id,
            available,
            gifts,
            specs,
            updated,
        };
        const createdProduct = await req.db.collection('products').insertOne(product);
        res.status(201).json(createdProduct.ops[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Обновить продукт
const updateProduct = async (req, res) => {
    const {
        url,
        price,
        oldprice,
        currencyId,
        categoryId,
        picture,
        name,
        brandId,
        guid,
        slug,
        installment,
        vendor,
        vendorCode,
        locations,
        badges,
        id,
        available,
        gifts,
        specs,
        updated,
    } = req.body;
    try {
        const product = {
            url,
            price,
            oldprice,
            currencyId,
            categoryId,
            picture,
            name,
            brandId,
            guid,
            slug,
            installment,
            vendor,
            vendorCode,
            locations,
            badges,
            id,
            available,
            gifts,
            specs,
            updated,
        };
        const updatedProduct = await req.db.collection('products').findOneAndUpdate(
            { _id: ObjectId(req.params.id) },
            { $set: product },
            { returnOriginal: false }
        );
        res.json(updatedProduct.value);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Удалить продукт
const deleteProduct = async (req, res) => {
    try {
        const result = await req.db.collection('products').deleteOne({ _id: ObjectId(req.params.id) });
        if (result.deletedCount === 1) {
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
