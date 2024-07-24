// Получить доступные фильтры с учетом фильтрации по городу, цене, бренду и характеристикам
const getAvailableFilters = async (req, res) => {
    try {
        const { city, minPrice, maxPrice, brandId, ...filters } = req.query;
        if (!city) {
            return res.status(400).json({ message: 'City is required' });
        }

        // Создаем критерии фильтрации на основе переданных фильтров
        const filterCriteria = {
            'locations': {
                $elemMatch: {
                    id: city,
                    stock_quantity: { $gt: 0 }
                }
            }
        };

        // Добавляем фильтрацию по цене, если указаны минимальная и/или максимальная цена
        if (minPrice || maxPrice) {
            filterCriteria.price = {};
            if (minPrice) {
                filterCriteria.price.$gte = Number(minPrice);
            }
            if (maxPrice) {
                filterCriteria.price.$lte = Number(maxPrice);
            }
        }

        // Добавляем фильтрацию по бренду, если указан brandId
        if (brandId) {
            filterCriteria.brandId = Number(brandId);
        }

        // Добавляем фильтрацию по характеристикам
        Object.keys(filters).forEach(key => {
            filterCriteria[`specs.${key}`] = filters[key];
        });

        // Логируем критерии фильтрации
        console.log('Filter criteria:', JSON.stringify(filterCriteria, null, 2));

        // Находим все продукты, доступные в указанном городе с учетом фильтров
        const availableProducts = await req.db.collection('products').find(filterCriteria).toArray();

        // Логируем найденные продукты
        console.log('Available products:', availableProducts);

        // Если нет найденных продуктов, возвращаем пустой массив
        if (!availableProducts.length) {
            return res.json({});
        }

        // Собираем уникальные фильтры из доступных продуктов
        const availableFilters = {};
        availableProducts.forEach(product => {
            product.specs.forEach(spec => {
                if (!availableFilters[spec.name]) {
                    availableFilters[spec.name] = new Set();
                }
                availableFilters[spec.name].add(spec.value);
            });
        });

        // Преобразуем множества в массивы
        const filterResponse = {};
        Object.keys(availableFilters).forEach(key => {
            filterResponse[key] = Array.from(availableFilters[key]);
        });

        res.json(filterResponse);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAvailableFilters };
