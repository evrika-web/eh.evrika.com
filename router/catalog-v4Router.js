const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { Client } = require("@elastic/elasticsearch");
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
});

//CATALOG-V4
function buildQuery(filters) {
  const query = {};

  if (filters.categoryId) {
    query.categoryId = parseInt(filters.categoryId);
  }

  if (filters.brandId) {
    query.brandId = parseInt(filters.brandId);
  }

  if (filters.specs) {
    filters.specs.forEach((spec) => {
      query["specs"] = {
        $elemMatch: {
          specid: parseInt(spec.id),
          valueid: parseInt(spec.value),
        },
      };
    });
  }

  // Добавьте другие фильтры по необходимости

  return query;
}

router.get("/products", async (req, res) => {
  const {
    cityId = 1,
    page = 1,
    limit = 20,
    sort = "name",
    order = "asc",
    ...filters
  } = req.query;
  const sortOrder = order === "asc" ? 1 : -1;

  const city = await City.findById(cityId);
  if (!city) {
    return res.status(404).json({ message: "Город не найден" });
  }

  const availableLocations = city.deliveryFrom;

  const query = buildQuery(filters); // Функция для построения MongoDB запроса на основе фильтров

  // Добавляем условие наличия на складе или возможность доставки
  query.$or = [
    {
      "locations.id": { $in: availableLocations },
      "locations.stock_quantity": { $gt: 0 },
    },
    // Дополнительные условия при необходимости
  ];

  const products = await Product.find(query)
    .sort({ [sort]: sortOrder })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json(products);
});

// GET /products/group-by-brand
router.get("/products/group-by-brand", async (req, res) => {
  try {
    const aggregation = [
      {
        $group: {
          _id: "$brandId",
          count: { $sum: 1 },
          products: { $push: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "_id",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      {
        $unwind: "$brandDetails",
      },
      {
        $project: {
          _id: 1,
          count: 1,
          products: 1,
          brandName: "$brandDetails.name",
        },
      },
    ];

    const result = await Product.aggregate(aggregation);

    res.json(result);
  } catch (error) {
    console.error("Ошибка при группировке товаров по брендам:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

// GET /api/products/search
router.get("/search", async (req, res) => {
  try {
    let { q, page = 1, limit = 20 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (!q) {
      return res.status(400).json({ message: "Не указан поисковый запрос" });
    }

    // Проверка на редирект (предполагается, что есть коллекция Redirect)
    const Redirect = require("../models/Redirect");
    const redirect = await Redirect.findOne({ keyword: q.toLowerCase() });
    if (redirect) {
      return res.redirect(redirect.url);
    }

    // Поиск с фаззи-поиском и синонимами
    const result = await client.search({
      index: "products",
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: q,
                  fields: ["name^3", "vendor.raw^4"],
                  type: "most_fields",
                  fuzziness: "AUTO",
                },
              },
            ],
            should: [
              {
                match_phrase: {
                  name: {
                    query: q,
                    boost: 2,
                  },
                },
              },
            ],
            filter: [],
          },
        },
        highlight: {
          fields: {
            name: {},
            description: {},
          },
        },
        sort: [
        ],
        aggs: {
          brands: {
            terms: {
              field: "vendor.raw",
              size: 10,
            },
          },
          categories: {
            terms: {
              field: "categoryId",
              size: 10,
            },
          },
        },
        from: (page - 1) * limit,
        size: limit,
      },
    });
    console.log("🚀 ~ router.get ~ result:", result);

    const hits = result.hits.hits.map((hit) => ({
      id: hit._id,
      ...hit._source,
      score: hit._score,
      highlight: hit.highlight,
    }));
    if (hits.length === 0) {
      res.status(404).json({ message: "Товар не найден" });
    } else {
      const categories = result.aggregations.categories.buckets;
      const brands = result.aggregations.brands.buckets;

      const total = result.hits.total.value;

      res.json({
        page,
        limit,
        total,
        categories,
        brands,
        products: hits,
      });
    }
  } catch (err) {
    console.error("Ошибка при поиске товаров:", err);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});
// GET /api/products/suggest?q=прин
router.get("/suggest", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Не указан поисковый запрос" });
    }

    const result = await client.search({
      index: "products",
      body: {
        suggest: {
          product_suggest: {
            prefix: q,
            completion: {
              field: "suggest",
            },
          },
        },
      },
    });

    const suggestions = result.suggest.product_suggest[0].options.map(
      (option) => option.text
    );

    res.json({
      suggestions,
    });
  } catch (err) {
    console.error(`Ошибка при поиске предложений: ${err}`);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

module.exports = router;
