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
      (filter = { id: body.category_id.toString() })
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
          bank_coefficient_month: 12,
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
          category_name: category.value,
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
      res.json({ data: products, links: links, meta: meta });
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

    //ToDo: return exact data from branch availability
    filtersFinal.push({
      type: "custom_view",
      name: "warehouse",
      sort: 0,
      title: "Наличие",
      view: "cms-catalog::site.partials.branch-handler",
      view_data: {
        warehouseName: "warehouse",
        stockName: "in_stock",
        branches: [
          {
            id: 4,
            published: true,
            city_id: 1,
            phones: ["+7 705 956 02 01"],
            map: {
              zoom: 16,
              center: {
                lat: 43.22745794557752,
                lng: 76.95805303752404,
              },
              marker: {
                lat: 43.228104234582105,
                lng: 76.9593921296076,
              },
            },
            start_work_time: "10:00:00",
            end_work_time: "21:00:00",
            sort: 0,
            image: "qRM2OzWfjaUdyIuG3AntOwTpz0a4fVcDb4NeTLKw.jpg",
            code_in_1c: "9999",
            created_at: "2021-01-26T19:44:37.000000Z",
            updated_at: "2023-03-06T07:44:15.000000Z",
            guid: "c5aced92-9bb5-11e8-80e9-1866da78d386",
            parent_id: null,
            is_pvz: 0,
            distribution_center: 0,
            name: 'ТРЦ "Ритц Палас", пр. Аль Фараби, 1',
            slug: "prospekt-al-farabi-1-trts-ritts-palas",
            work_time: "Пн-Вс: с 10:00 до 21:00",
            address: "",
            point: "",
            translation: {
              id: 10,
              branch_id: 4,
              locale: "ru",
              name: 'ТРЦ "Ритц Палас", пр. Аль Фараби, 1',
              point: "",
              address: "",
              slug: "prospekt-al-farabi-1-trts-ritts-palas",
              work_time: "Пн-Вс: с 10:00 до 21:00",
            },
          },
          {
            id: 6565,
            published: true,
            city_id: 1,
            phones: ["+7 771 805 19 43"],
            map: {
              zoom: 18,
              center: {
                lat: 43.20726438864253,
                lng: 76.85925573135678,
              },
              marker: {
                lat: 43.20772349801647,
                lng: 76.85814797903363,
              },
            },
            start_work_time: "10:00:00",
            end_work_time: "22:00:00",
            sort: 1,
            image: null,
            code_in_1c: "0",
            created_at: "2023-03-13T10:56:39.000000Z",
            updated_at: "2023-03-13T11:13:46.000000Z",
            guid: "b9a0f5dc-b99c-11ed-80ed-bc97e145c062",
            parent_id: null,
            is_pvz: 1,
            distribution_center: 0,
            name: 'ТРЦ "Almaty Mall", Пункт выдачи заказов,  ул. Жандосова, 83',
            slug: "pvz-almaty-mall-ul-zhandosova-83",
            work_time: "Пн-Вс: с 10:00 до 22:00",
            address: "",
            point: "",
            translation: {
              id: 123,
              branch_id: 6565,
              locale: "ru",
              name: 'ТРЦ "Almaty Mall", Пункт выдачи заказов,  ул. Жандосова, 83',
              point: "",
              address: "",
              slug: "pvz-almaty-mall-ul-zhandosova-83",
              work_time: "Пн-Вс: с 10:00 до 22:00",
            },
          },
          {
            id: 6563,
            published: true,
            city_id: 1,
            phones: ["+7 705 758 80 94"],
            map: {
              zoom: 17,
              center: {
                lat: 43.22509892026622,
                lng: 76.90837518518066,
              },
              marker: {
                lat: 43.225044,
                lng: 76.908976,
              },
            },
            start_work_time: "10:00:00",
            end_work_time: "22:00:00",
            sort: 2,
            image: "8mA8ugz5CpxfVPG7oHiWGgCJqTamszMt1tYMiJuY.jpeg",
            code_in_1c: "58",
            created_at: "2021-12-08T08:44:58.000000Z",
            updated_at: "2023-03-13T11:01:15.000000Z",
            guid: "6d2fddb4-5328-11ec-80d8-bc97e145c062",
            parent_id: 31,
            is_pvz: 1,
            distribution_center: 0,
            name: 'ТРЦ "Атакент Молл", Пункт выдачи заказов',
            slug: "punkt-vydachi-zakazov-atakent-moll",
            work_time: "Пн-Вс: с 10:00 до 22:00",
            address: "",
            point: "",
            translation: {
              id: 114,
              branch_id: 6563,
              locale: "ru",
              name: 'ТРЦ "Атакент Молл", Пункт выдачи заказов',
              point: "",
              address: "",
              slug: "punkt-vydachi-zakazov-atakent-moll",
              work_time: "Пн-Вс: с 10:00 до 22:00",
            },
          },
          {
            id: 1568,
            published: true,
            city_id: 1,
            phones: ["+7 705 758 60 33"],
            map: {
              zoom: 15,
              center: {
                lat: 43.23932640327847,
                lng: 76.84645915030387,
              },
              marker: {
                lat: 43.23755251300925,
                lng: 76.84946648776511,
              },
            },
            start_work_time: "10:00:00",
            end_work_time: "22:00:00",
            sort: 3,
            image: "saJJ7LGraBoFjefJDmM6Av9lDMaiQ4ouR1mLfX1v.jpg",
            code_in_1c: "0",
            created_at: "2021-06-03T06:16:17.000000Z",
            updated_at: "2023-03-13T11:01:15.000000Z",
            guid: "a9d67712-77fe-11eb-80c6-bc97e145c062",
            parent_id: 31,
            is_pvz: 1,
            distribution_center: 0,
            name: 'ТРЦ "Гранд Парк", Пункт выдачи заказов',
            slug: "ul-kabdolova-1-trts-grand-park-blok-5",
            work_time: "Пн-Вс: с 10:00 до 22:00",
            address: "",
            point: "",
            translation: {
              id: 103,
              branch_id: 1568,
              locale: "ru",
              name: 'ТРЦ "Гранд Парк", Пункт выдачи заказов',
              point: "",
              address: "",
              slug: "ul-kabdolova-1-trts-grand-park-blok-5",
              work_time: "Пн-Вс: с 10:00 до 22:00",
            },
          },
          {
            id: 1569,
            published: true,
            city_id: 1,
            phones: ["+7 705 758 86 95"],
            map: {
              zoom: 19,
              center: {
                lat: 43.33651291171535,
                lng: 76.95608552992846,
              },
              marker: {
                lat: 43.336355525136575,
                lng: 76.95337497882024,
              },
            },
            start_work_time: "10:00:00",
            end_work_time: "22:00:00",
            sort: 4,
            image: "4RCiGIcyZ73GqlFqkJ2p06GHLp6v6I0OrpySwp1H.jpg",
            code_in_1c: "0",
            created_at: "2021-06-03T06:18:09.000000Z",
            updated_at: "2023-03-13T11:01:15.000000Z",
            guid: "118aabca-c41f-11eb-80cc-bc97e145c062",
            parent_id: 31,
            is_pvz: 1,
            distribution_center: 0,
            name: 'ТРЦ "Mart", Пункт выдачи заказов',
            slug: "ul-riharda-zorge-18-v-trts-mart",
            work_time: "Пн-Вс: с 10:00 до 22:00",
            address: "",
            point: "",
            translation: {
              id: 106,
              branch_id: 1569,
              locale: "ru",
              name: 'ТРЦ "Mart", Пункт выдачи заказов',
              point: "",
              address: "",
              slug: "ul-riharda-zorge-18-v-trts-mart",
              work_time: "Пн-Вс: с 10:00 до 22:00",
            },
          },
        ],
      },
      isTrueFale: false,
    });

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
      if (
        spec.name === "badge_0" ||
        spec.name === "badge_1" ||
        spec.name === "badge_2" ||
        spec.name === "badge_3"
      )
        continue;
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
      log.info("Update products log ", {
        created: catalogUpdate.created,
        updated: catalogUpdate.updated,
      });
    else {
      throw new Error("Update products data error: ", catalogUpdate);
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
