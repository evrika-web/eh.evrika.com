const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category'); // Подключаем модель категорий

// Маршрут для получения фильтров
router.post('/v2/catalog/filters', async (req, res) => {
    const { category_id, city_id, filters = {} } = req.body;
    const filterBrands = filters.brand || [];
    const costFrom = filters['cost-from'] || 0;
    const costTo = filters['cost-to'] || Number.MAX_SAFE_INTEGER;

    try {
        const query = {
            categoryId: category_id,
            price: { $gte: costFrom, $lte: costTo },
            locations: { $elemMatch: { id: city_id, stock_quantity: { $gt: 0 } } }
        };

        if (filterBrands.length > 0) {
            query.vendor = { $in: filterBrands };
        }

        // Применяем фильтры характеристик
        Object.keys(filters).forEach(filter => {
            if (filter !== 'brand' && filter !== 'cost-from' && filter !== 'cost-to') {
                query[`specs`] = { 
                    $elemMatch: {
                        specslug: filter,
                        valueslug: { $in: filters[filter] }
                    }
                };
            }
        });

        console.log("🚀 ~ router.post ~ query:", query)
        const products = await Product.find(query).lean();

        const priceRange = {
            min_value: Math.min(...products.map(p => p.price)),
            max_value: Math.max(...products.map(p => p.price))
        };

        const availableSpecsFilter = {};
        const allSpecsFilter = {};
        const specSortOrder = {};
        const specCounts = {};

        const allProducts = await Product.find({ categoryId: category_id }).lean();

        allProducts.forEach(product => {
            product.specs.forEach(spec => {
                if (spec.code !== 'badge') {
                    if (!allSpecsFilter[spec.name]) {
                        allSpecsFilter[spec.name] = new Map();
                    }
                    allSpecsFilter[spec.name].set(spec.value, spec);
                    specSortOrder[spec.name] = spec.specsort;

                    if (!specCounts[spec.name]) {
                        specCounts[spec.name] = {};
                    }
                    if (!specCounts[spec.name][spec.value]) {
                        specCounts[spec.name][spec.value] = 0;
                    }
                    specCounts[spec.name][spec.value] += 1;
                }
            });
        });

        products.forEach(product => {
            product.specs.forEach(spec => {
                if (spec.code !== 'badge') {
                    if (!availableSpecsFilter[spec.name]) {
                        availableSpecsFilter[spec.name] = new Map();
                    }
                    availableSpecsFilter[spec.name].set(spec.value, spec);
                }
            });
        });

        const sortedSpecs = Object.keys(allSpecsFilter)
            .sort((a, b) => specSortOrder[a] - specSortOrder[b]);

        const specsResponse = sortedSpecs.map(name => {
            const values = Array.from(allSpecsFilter[name].values());
            const sortedValues = values.sort((a, b) => a.valuesort - b.valuesort);

            return {
                type: 'checkbox',
                spec_id: sortedValues[0].specid,
                name: sortedValues[0].specslug,
                sort: sortedValues[0].specsort,
                is_filter_group: false,
                title: sortedValues[0].name,
                tooltip: null,
                options: sortedValues.map(spec => {
                    const isDisabled = !availableSpecsFilter[name] || !availableSpecsFilter[name].has(spec.value);
                    return {
                        id: spec.valueid,
                        url: "https://evrika.com",
                        name: spec.value,
                        value: spec.valueslug,
                        sort: spec.valuesort,
                        disabled: isDisabled,
                        selected: filters[sortedValues[0].specslug]?.includes(spec.valueslug) || false,
                        count: isDisabled ? 0 : specCounts[name][spec.value] || 0
                    };
                }),
                isTrueFale: false
            };
        });

        const availableBrands = new Set(products.map(product => product.vendor));
        const allBrands = new Set(allProducts.map(product => product.vendor));

        const brandOptions = Array.from(allBrands).sort().map(brand => ({
            name: brand,
            value: brand,
            selected: filterBrands.includes(brand),
            disabled: !availableBrands.has(brand),
            url: "https://rnd2.evrika.com",
            count: availableBrands.has(brand) ? products.filter(p => p.vendor === brand).length : 0
        }));

        const response = [
            {
                range: priceRange,
                type: "number_range",
                sort: 0,
                from: {
                    name: "cost_from",
                    min: priceRange.min_value,
                    value: costFrom,
                    placeholder: "от"
                },
                to: {
                    name: "cost_to",
                    max: priceRange.max_value,
                    value: costTo,
                    placeholder: "до"
                },
                title: "Цена",
                currency: "₸",
                isTrueFale: false
            },
            {
                type: "checkbox",
                name: "brand",
                sort: 0,
                title: "Бренд",
                options: brandOptions,
                isTrueFale: false
            },
            ...specsResponse
        ];

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Маршрут для получения товаров с учетом фильтров, пагинации и сортировки по различным критериям
router.post('/v2/catalog/products', async (req, res) => {
    const { category_id, city_id, filters = {}, sort = "popular", page = 1 } = req.body;
    const filterBrands = filters.brand || [];
    const costFrom = filters['cost-from'] || 0;
    const costTo = filters['cost-to'] || Number.MAX_SAFE_INTEGER;
    const perPage = 23; // количество товаров на странице

    try {
        const query = {
            categoryId: category_id,
            price: { $gte: costFrom, $lte: costTo }
        };

        if (filterBrands.length > 0) {
            query.vendor = { $in: filterBrands };
        }

        // Применяем фильтры характеристик
        Object.keys(filters).forEach(filter => {
            if (filter !== 'brand' && filter !== 'cost-from' && filter !== 'cost-to') {
                query[`specs`] = { 
                    $elemMatch: {
                        specslug: filter,
                        valueslug: { $in: filters[filter] }
                    }
                };
            }
        });

        let sortOption = {};
        switch (sort) {
            case "cost-asc":
                sortOption.price = 1;
                break;
            case "cost-desc":
                sortOption.price = -1;
                break;
            case "rating":
                sortOption.rating = -1; // Сортировка по рейтингу в порядке убывания
                break;
            case "created-at":
                sortOption.createdAt = -1; // Сортировка по дате создания в порядке убывания
                break;
            case "popular":
            default:
                sortOption.popularity = -1; // Сортировка по популярности в порядке убывания
                break;
        }

        const totalProducts = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort(sortOption)
            .lean();

        // Получаем название категории
        const category = await Category.findOne({ id: category_id }).lean();
        const categoryName = category ? category.name : "";

        const productsWithAvailability = products.map(product => {
            const isAvailable = Array.isArray(product.locations) && product.locations.some(location => location.id === city_id && location.stock_quantity > 0);
            return {
                ...product,
                availableForPurchase: isAvailable
            };
        });

        const sortedProducts = productsWithAvailability.sort((a, b) => b.availableForPurchase - a.availableForPurchase);

        const paginatedProducts = sortedProducts.slice((page - 1) * perPage, page * perPage);

        const response = {
            data: paginatedProducts.map(product => ({
                id: product.id,
                guid: product.guid,
                slug: product.slug,
                url: product.url,
                vendor_code: product.vendorCode,
                name: product.name,
                bank_coefficient_month: product.installment,
                bank_coefficient: (1 / product.installment).toFixed(10),
                cost: product.price,
                old_cost: product.oldprice,
                availableForPurchase: product.availableForPurchase,
                availableForPurchaseFromDc: Array.isArray(product.locations) && product.locations.some(location => location.id === city_id && location.stock_quantity > 0),
                deliveryDate: "",
                pickUpDate: "",
                stock: Array.isArray(product.locations) ? product.locations.reduce((total, location) => total + location.stock_quantity, 0) : 0,
                brand: product.vendor,
                category_id: product.categoryId,
                category_name: categoryName,
                variant: "",
                is_preorder: false,
                badges: product.badges,
                gift: product.gifts,
                position: -1,
                images: product.picture ? [product.picture] : []
            })),
            meta: {
                current_page: page,
                from: (page - 1) * perPage + 1,
                last_page: Math.ceil(totalProducts / perPage),
                path: "https://evrika.com/catalog",
                per_page: perPage,
                to: Math.min(page * perPage, totalProducts),
                total: totalProducts
            }
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
