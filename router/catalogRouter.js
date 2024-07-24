const express = require("express");
const router = express.Router();
const moment = require("moment");
require("dotenv").config();
const SimpleNodeLogger = require("simple-node-logger");
const { getAppLog } = require("../utility/appLoggers");
const searchLog = getAppLog("Search");
const { default: axios } = require("axios");
const {
  aggregateCollection,
  getAllFromCollection,
  getDistinct,
  getOneFromCollectionByFilter,
  insertManyData,
  replaceOne,
} = require("../database/mongoDb/mongoQuerie");
const catalogMatching = require("../utility/dataMatching");
const { XMLParser } = require("fast-xml-parser");
const {
  updateData,
  updateCategories,
  updateCities,
  updateBranches,
} = require("../api/catalog/catalogApi");
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require("../controllers/productController");
const { getAvailableFilters } = require("../controllers/filterController");

opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-search.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

router.post("/catalog/products", async (req, res) => {
  var body = req.body;
  var sort = body.sort || "";
  var page = body.page || 1;
  var limit = body.limit || 23;
  var conditions = catalogMatching(body, "products");
  try {
    var data = await getAllFromCollection(
      "products",
      (fields = {}),
      (filters = conditions),
      (page = page),
      (sort = sort),
      (limit = limit)
      );
    var category = await getOneFromCollectionByFilter(
      "categories",
      (filter = { id: Number(body.category_id) })
      );
    let products = [];
    if (!Array.isArray(data) && data.result.length > 0) {
      data.result.forEach((element) => {
        const foundLocality = element.locations.find(
          ({ id }) => id === body.city_id.toString()
        );
        let tempProduct = {
          id: parseInt(element.id),
          guid: element.guid,
          slug: element.slug,
          url: element.url,
          vendor_code: element.vendorCode,
          name: element.name,
          bank_coefficient_month: process.env.INSTALLMENT_TERM || 12,
          bank_coefficient: "0,0833333333",
          cost: element.price,
          old_cost: element?.oldprice,
          availableForPurchase: true,
          availableForPurchaseFromDc: false,
          deliveryDate: "",
          pickUpDate: "",
          stock: foundLocality.stock_quantity
            ? foundLocality.stock_quantity
            : 0,
          brand: element.vendor,
          category_id: element.categoryId,
          category_name: category.name,
          variant: "",
          is_preorder: false,
          badges: element.badges,
          gift: element.gifts,
          position: -1,
          images: [element.picture],
        };
        products.push(tempProduct);
      });

      let metaTo = 0;
      if (data.count < limit) {
        metaTo = data.count;
      } else if ((Number(page) - 1) * limit + limit >= data.count) {
        metaTo = data.count;
      } else {
        metaTo = (Number(page) - 1) * limit + limit;
      }
      let meta = {
        current_page: page,
        from: (Number(page) - 1) * limit + 1,
        last_page: Math.ceil(data.count / limit),
        path: process.env.FRONT_URL + "/catalog",
        per_page: limit,
        to: metaTo,
        total: data.count,
      };
      res.json({ data: products,  meta: meta });
    } else {
      res
        .status(404)
        .send({ error: "There is no products matching your filters" });
    }
  } catch (err) {
    res.status(404).send({ error: err.toString() });
  }
});

router.post("/catalog/filters", async (req, res) => {
  const body = req.body;
  const filtersData = req.body.filters || {};
  const categoryData = req.body.category_id;
  const conditions = catalogMatching(body, "filters");
  const conditionsForPrice = catalogMatching(body, "prices");

  try {
    let filtersFinal = [];

    // Get price filter
    let aggregateArr = [
      { $match: conditionsForPrice },
      {
        $group: {
          _id: null,
          maxPrice: { $max: "$price" },
          minPrice: { $min: "$price" },
        },
      },
    ];

    let prices = await aggregateCollection("products", aggregateArr);
    if (!Array.isArray(prices) || prices.length === 0) {
      prices = await aggregateCollection("products", [
        {
          $match: {
            $and: [
              { available: true },
              { categoryId: parseInt(categoryData) },
            ],
          },
        },
        {
          $group: {
            _id: null,
            maxPrice: { $max: "$price" },
            minPrice: { $min: "$price" },
          },
        },
      ]);
    }

    if (!Array.isArray(prices) || prices.length === 0) {
      throw new Error("No prices found");
    }

    const costFrom = filtersData.cost_from ? parseInt(filtersData.cost_from[0]) : prices[0].minPrice;
    const costTo = filtersData.cost_to ? parseInt(filtersData.cost_to[0]) : prices[0].maxPrice;

    filtersFinal.push({
      range: {
        min_value: prices[0].minPrice,
        max_value: prices[0].maxPrice,
      },
      type: "number_range",
      sort: 0,
      from: {
        name: "cost_from",
        min: prices[0].minPrice || 0,
        value: costFrom,
        placeholder: "от",
      },
      to: {
        name: "cost_to",
        max: prices[0].maxPrice || 0,
        value: costTo,
        placeholder: "до",
      },
      title: "Цена",
      currency: "₸",
      isTrueFale: false,
    });

    // Get brands filter
    const allBrands = await getDistinct("products", "vendor", { categoryId: parseInt(categoryData) || 234 });

    if (allBrands) {
      const options = allBrands.map((brand) => ({
        name: brand,
        value: brand,
        selected: filtersData.brand && Array.isArray(filtersData.brand) && filtersData.brand.includes(brand),
        disabled: false,
        url: "https://rnd2.evrika.com",
      }));

      filtersFinal.push({
        type: "checkbox",
        name: "brand",
        sort: 0,
        title: "Бренд",
        options: options,
        isTrueFale: false,
      });
    }

    // Get other filters
    const availableFilters = await getDistinct("products", "specs", conditions);
    const allFilters = await getDistinct("products", "specs", { categoryId: parseInt(categoryData) || 234 });

    const specsObj = [
      ...new Map(availableFilters.map((item) => [item.specslug, item])).values(),
    ];

    for (const spec of specsObj) {
      if (["badge_0", "badge_1", "badge_2", "badge_3", "badge_4"].includes(spec.name)) {
        continue;
      }

      const options = [];
      const specslugData = spec.specslug;
      const foundValues = allFilters.filter(({ specslug }) => specslug === specslugData);

      for (const value of foundValues) {
        const filteredObj = {
          id: parseInt(value.valueid) || 0,
          url: process.env.FRONT_URL || "https://evrika.com",
          name: value.value,
          value: value.valueslug,
          sort: value.valuesort,
          disabled: !availableFilters.some(({ valueslug }) => valueslug === value.valueslug),
          selected: filtersData[specslugData] && Array.isArray(filtersData[specslugData]) && filtersData[specslugData].includes(value.valueslug),
        };

        if (!options.some(({ value }) => value === filteredObj.value)) {
          options.push(filteredObj);
        }
      }

      const sortedOptions = [...options].sort((a, b) => a.sort - b.sort);

      filtersFinal.push({
        type: "checkbox",
        spec_id: spec.specid,
        name: specslugData,
        sort: spec.specsort || 0,
        is_filter_group: false,
        title: spec.name,
        tooltip: null,
        options: sortedOptions,
        isTrueFale: false,
      });
    }

    filtersFinal.sort((a, b) => a.sort - b.sort);
    searchLog("success");
    res.status(200).json(filtersFinal);
  } catch (err) {
    res.status(500).send({ error: err.toString() });
  }
});


router.get("/update-products", async (req, res) => {
  try {
    let catalogUpdate = await updateData();
    if (catalogUpdate.status === 200)
      {log.info("Update products log ", {
        created: catalogUpdate.created,
        updated: catalogUpdate.updated,
      });
      res.status(200).json({
        created: catalogUpdate.created,
        updated: catalogUpdate.updated,
      });}
    else {
      throw new Error("Update products data error: ", catalogUpdate.error);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: err.toString() });
  }
});

router.get("/update-categories", async (req, res) => {
  try {
    let catalogUpdate = await updateCategories();
    if (catalogUpdate.status === 200) {
      log.info("Update categories log ", {
        created: catalogUpdate.created,
        updated: catalogUpdate.updated,
      });
      res.status(200).send({
        created: catalogUpdate.created,
        updated: catalogUpdate.updated,
      });
    } else {
      throw new Error("Update categories data error: ", catalogUpdate.error);
    }
  } catch (err) {
    console.log("CATCH: " + err);
    res.status(500).send({ error: err.toString() });
  }
});

router.get("/update-cities", async (req, res) => {
  try {
    let catalogUpdate = await updateCities();
    if (catalogUpdate.status === 200) {
      log.info("Update cities log ", {
        created: catalogUpdate.created,
        updated: catalogUpdate.updated,
      });
      res.status(200).send({
        created: catalogUpdate.created,
        updated: catalogUpdate.updated,
      });
    } else {
      throw new Error("Update cities data error: ", catalogUpdate.error);
    }
  } catch (err) {
    console.log("CATCH: " + err);
    res.status(500).send({ error: err.toString() });
  }
});

router.get("/update-branches", async (req, res) => {
  try {
    let catalogUpdate = await updateBranches();
    if (catalogUpdate.status === 200) {
      log.info("Update branches log ", {
        created: catalogUpdate.created,
        updated: catalogUpdate.updated,
      });
      res.status(200).send({
        created: catalogUpdate.created,
        updated: catalogUpdate.updated,
      });
    } else {
      throw new Error("Update branches data error: ", catalogUpdate.error);
    }
  } catch (err) {
    console.log("CATCH: " + err);
    res.status(500).send({ error: err.toString() });
  }
});

router.get("/update-stocks", async (req, res) => {
  try {
    let catalogUpdate = await updateStocks();
    if (catalogUpdate.status === 200) {
      log.info("Update stocks log ", {
        created: catalogUpdate.created,
        updated: catalogUpdate.updated,
      });
      res.status(200).send({
        created: catalogUpdate.created,
        updated: catalogUpdate.updated,
      });
    } else {
      throw new Error("Update stocks data error: ", catalogUpdate.error);
    }
  } catch (err) {
    console.log("CATCH: " + err);
    res.status(500).send({ error: err.toString() });
  }
});


// //V2 catalog
// router.route('/v2/catalog/products').get(getProducts).post(createProduct);
// router.route('/v2/catalog/products/:id').get(getProductById).put(updateProduct).delete(deleteProduct);
// router.route('/v2/catalog/filters').get(getAvailableFilters);
module.exports = router;
