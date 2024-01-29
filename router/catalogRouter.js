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
  console.log(
    "🚀 ~ file: searchRouter.js:28 ~ router.post ~ conditions:",
    JSON.stringify(conditions)
  );
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
          guid: "",
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
          badges: [],
          gift: [],
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
      console.log("🚀 ~ router.post ~ meta:", meta)
      console.log("🚀 ~ router.post ~ meta:", products,   meta )
      res.json({ data: products,  meta: meta });
    } else {
      res
        .status(404)
        .send({ error: "There is no products matching your filters" });
    }
  } catch (err) {
    res.status(500).send({ error: err.toString() });
  }
});

router.post("/catalog/filters", async (req, res) => {
  var body = req.body;
  var filtersData = req.body.filters;
  var categoryData = req.body.category_id;
  var conditions = catalogMatching(body, "filters");
  console.log(
    "🚀 ~ file: searchRouter.js:128 ~ router.post ~ conditions:",
    JSON.stringify(conditions)
  );
  var conditionsForPrice = catalogMatching(body, "prices");
  try {
    let filtersFinal = [];

    //get price filter
    let aggregateArr = [];
    aggregateArr.push({ $match: conditionsForPrice });
    aggregateArr.push({
      $group: {
        _id: null,
        maxPrice: { $max: "$price" },
        minPrice: { $min: "$price" },
      },
    });
    var prices = await aggregateCollection("products", aggregateArr);
    if (!Array.isArray(prices) || prices.length === 0) {
      prices = await aggregateCollection("products", [
        {
          $match: {
            $and: [
              { available: "true" },
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

    let costFrom = null;
    let costTo = null;
    if (
      Object.keys(filtersData).length != 0 &&
      Array.isArray(filtersData.cost_from)
    ) {
      costFrom = filtersData.cost_from[0];
    }
    if (
      Object.keys(filtersData).length != 0 &&
      Array.isArray(filtersData.cost_to)
    ) {
      costTo = filtersData.cost_to[0];
    }
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
        value: costFrom ? parseInt(costFrom) : prices[0].minPrice || 0,
        placeholder: "от",
      },
      to: {
        name: "cost_to",
        max: prices[0].maxPrice || 0,
        value: costTo ? parseInt(costTo) : prices[0].maxPrice || 0,
        placeholder: "до",
      },
      title: "Цена",
      currency: "₸",
      isTrueFale: false,
    });

    //get brands filter
    var allBrands = await getDistinct(
      "products",
      (fieldname = "vendor"),
      (filters = { categoryId: parseInt(categoryData) || 234 })
    );
    if (allBrands) {
      let options = [];
      for (let i in allBrands) {
        let tempobj = {
          name: allBrands[i],
          value: allBrands[i],
          selected: false,
          disabled: false,
          url: "https://rnd2.evrika.com",
        };
        if (
          Object.keys(filtersData).length != 0 &&
          Array.isArray(filtersData.brand) &&
          filtersData.brand.find((value) => value == allBrands[i]) != undefined
        ) {
          tempobj.selected = true;
        }
        options.push(tempobj);
      }
      filtersFinal.push({
        type: "checkbox",
        name: "brand",
        sort: 0,
        title: "Бренд",
        options: options,
        isTrueFale: false,
      });
    }

    //get others filter
    var availableFilters = await getDistinct(
      "products",
      (fieldname = "specs"),
      (filters = conditions)
    );

    var allFilters = await getDistinct(
      "products",
      (fieldname = "specs"),
      (filters = { categoryId: parseInt(categoryData) || 234 })
    );
    const specsObj = [
      ...new Map(
        availableFilters.map((item) => [item["specslug"], item])
      ).values(),
    ];
    for (let spec of specsObj) {
      let options = [];
      let specslugData = spec.specslug;
      const foundValues = allFilters.filter(
        ({ specslug }) => specslug === specslugData
      );
      for (let index in foundValues) {
        var filteredObj = {};
        filteredObj.id = 0;
        filteredObj.url = process.env.FRONT_URL || "https://evrika.com";
        filteredObj.name = foundValues[index].value;
        filteredObj.value = foundValues[index].valueslug;
        if (
          availableFilters.find(
            ({ valueslug }) => valueslug == foundValues[index].valueslug
          ) != undefined
        ) {
          filteredObj.disabled = false;
        } else {
          filteredObj.disabled = true;
        }
        if (
          Object.keys(filtersData).length != 0 &&
          Array.isArray(filtersData[specslugData]) &&
          filtersData[specslugData].find(
            (valueslug) => valueslug == foundValues[index].valueslug
          ) != undefined
        ) {
          filteredObj.selected = true;
        } else {
          filteredObj.selected = false;
        }
        options.push(filteredObj);
      }
      const optionsSorted = options.sort(
        (a, b) => Number(a.disabled) - Number(b.disabled)
      );
      filtersFinal.push({
        type: "checkbox",
        spec_id: spec.specid,
        name: specslugData,
        sort: 1,
        is_filter_group: false,
        title: spec.name,
        tooltip: null,
        options: optionsSorted,
        isTrueFale: false,
      });
    }

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
      console.log("🚀 ~ router.get ~ catalogUpdate:", catalogUpdate)
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

module.exports = router;
