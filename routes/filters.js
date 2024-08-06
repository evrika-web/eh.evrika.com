const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category'); // Подключаем модель категорий


// Маршрут для получения фильтров
router.post('/v2/catalog/filters', async (req, res) => {
    const { category_id, city_id, filters = {} } = req.body;
    const filterBrands = filters.brand || [];
    const costFromArray = filters['cost-from'] || [];
    const costToArray = filters['cost-to'] || [];

    // Проверка наличия значений и преобразование в числа
    const costFrom = costFromArray.length > 0 ? parseInt(costFromArray[0], 10) : null;
    const costTo = costToArray.length > 0 ? parseInt(costToArray[0], 10) : null;

    try {
        // Подготовка основного запроса с учетом всех фильтров, кроме цены
        const baseQuery = {
            categoryId: category_id,
            locations: { $elemMatch: { id: city_id, stock_quantity: { $gt: 0 } } }
        };

        // Применяем фильтры характеристик
        const specFilters = [];
        Object.keys(filters).forEach(filter => {
            if (filter !== 'brand' && filter !== 'cost-from' && filter !== 'cost-to') {
                specFilters.push({
                    $elemMatch: {
                        specslug: filter,
                        valueslug: { $in: filters[filter] }
                    }
                });
            }
        });

        if (specFilters.length > 0) {
            baseQuery.specs = { $all: specFilters };
        }

        // Запрос для получения товаров без учета фильтра по цене для расчета priceRange
        const productsWithoutPriceFilter = await Product.find(baseQuery).lean();

        const priceRange = {
            min_value: Math.min(...productsWithoutPriceFilter.map(p => p.price)),
            max_value: Math.max(...productsWithoutPriceFilter.map(p => p.price))
        };

        // Запрос для получения товаров с учетом всех фильтров, включая фильтр по цене
        const query = {
            ...baseQuery,
            price: { $gte: costFrom || 0, $lte: costTo || Number.MAX_SAFE_INTEGER }
        };

        const products = await Product.find(query).lean();

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
            const availableValues = values.filter(spec => availableSpecsFilter[name] && availableSpecsFilter[name].has(spec.value));
            const unavailableValues = values.filter(spec => !availableSpecsFilter[name] || !availableSpecsFilter[name].has(spec.value));

            availableValues.sort((a, b) => a.valuesort - b.valuesort);
            unavailableValues.sort((a, b) => a.valuesort - b.valuesort);

            return {
                type: 'checkbox',
                spec_id: availableValues[0] ? availableValues[0].specid : unavailableValues[0].specid,
                name: availableValues[0] ? availableValues[0].specslug : unavailableValues[0].specslug,
                sort: availableValues[0] ? availableValues[0].specsort : unavailableValues[0].specsort,
                is_filter_group: false,
                title: availableValues[0] ? availableValues[0].name : unavailableValues[0].name,
                tooltip: null,
                options: [
                    ...availableValues.map(spec => ({
                        id: spec.valueid,
                        url: "https://evrika.com",
                        name: spec.value,
                        value: spec.valueslug,
                        sort: spec.valuesort,
                        disabled: false,
                        selected: filters[spec.specslug]?.includes(spec.valueslug) || false,
                        count: specCounts[name][spec.value] || 0
                    })),
                    ...unavailableValues.map(spec => ({
                        id: spec.valueid,
                        url: "https://evrika.com",
                        name: spec.value,
                        value: spec.valueslug,
                        sort: spec.valuesort,
                        disabled: true,
                        selected: filters[spec.specslug]?.includes(spec.valueslug) || false,
                        count: 0
                    }))
                ],
                isTrueFale: false
            };
        });

        // Получение всех брендов и определение их доступности
        const allBrands = await Product.distinct('vendor', { categoryId: category_id });
        const availableBrandsSet = new Set(products.map(product => product.vendor));

        const availableBrands = allBrands.filter(brand => availableBrandsSet.has(brand)).sort();
        const unavailableBrands = allBrands.filter(brand => !availableBrandsSet.has(brand)).sort();

        const brandOptions = [
            ...availableBrands.map(brand => ({
                name: brand,
                value: brand,
                selected: filterBrands.includes(brand),
                disabled: false,
                url: "https://rnd2.evrika.com",
                count: products.filter(p => p.vendor === brand).length
            })),
            ...unavailableBrands.map(brand => ({
                name: brand,
                value: brand,
                selected: filterBrands.includes(brand),
                disabled: true,
                url: "https://rnd2.evrika.com",
                count: 0
            }))
        ];

        const response = [
            {
                range: priceRange,
                type: "number_range",
                sort: 0,
                from: {
                    name: "cost_from",
                    min: priceRange.min_value,
                    value: costFrom !== null ? String(costFrom) : null,
                    placeholder: "от"
                },
                to: {
                    name: "cost_to",
                    max: priceRange.max_value,
                    value: costTo !== null ? String(costTo) : null,
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
    const costFrom = filters['cost-from'] || [0];
    const costTo = filters['cost-to'] || [Number.MAX_SAFE_INTEGER];
    const perPage = 23; // количество товаров на странице

    try {
        const query = {
            categoryId: category_id,
            price: { $gte: costFrom[0], $lte: costTo[0] }
        };

        if (filterBrands.length > 0) {
            query.vendor = { $in: filterBrands };
        }

        // Применяем фильтры характеристик
        const specFilters = [];
        Object.keys(filters).forEach(filter => {
            if (filter !== 'brand' && filter !== 'cost-from' && filter !== 'cost-to') {
                specFilters.push({
                    $elemMatch: {
                        specslug: filter,
                        valueslug: { $in: filters[filter] }
                    }
                });
            }
        });

        if (specFilters.length > 0) {
            query.specs = { $all: specFilters };
        }
        console.log("🚀 ~ router.post product ~ query:", query)

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
