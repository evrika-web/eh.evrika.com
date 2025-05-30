const express = require("express");
const router = express.Router();
require("dotenv").config();
const { getAppLog } = require("../utility/appLoggers");
const searchLog = getAppLog("Search");
const {
  aggregateCollection,
  getAllFromCollection,
  getDistinct,
  getOneFromCollectionByFilter,
} = require("../database/mongoDB/mongoQuerie");
const catalogMatching = require("../utility/dataMatching");
const {
  updateData,
  updateCategories,
  updateCities,
  updateBranches,
  updateCosts,
  updateStocks,
} = require("../api/catalog/catalogApi");


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
  var body = req.body;
  var filtersData = req.body.filters;
  var categoryData = req.body.category_id;
  var conditions = catalogMatching(body, "filters");
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
      
      if(spec.name==='badge_0' ||  spec.name === 'badge_1' || spec.name === 'badge_2' || spec.name === 'badge_3' || spec.name === 'badge_4'){continue;}

      let options = [];
      let specslugData = spec.specslug;
      const foundValues = allFilters.filter(
        ({ specslug }) => specslug === specslugData
      );
      for (let index in foundValues) {
        

        var filteredObj = {};
        filteredObj.id = parseInt(foundValues[index].valueid) ||0;
        filteredObj.url = process.env.FRONT_URL || "https://evrika.com";
        filteredObj.name = foundValues[index].value;
        filteredObj.value = foundValues[index].valueslug;
        filteredObj.sort = foundValues[index].valuesort;

        if (
          options.find(
            ({ value }) => value == filteredObj.value
          ) != undefined
        ){
          continue;
        }

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
      let disabledFilters = []
      let selectedFilters = []
      let otherfilters = []
      options.map(e=>{
        if(e.disabled){
          disabledFilters.push(e)
        } else if(!e.disabled &&  e.selected){
          selectedFilters.push(e)
        }else{
          otherfilters.push(e)
        }
      })
      
      let optionsSorted = []
      let selectedFiltersSorted = selectedFilters.sort(
        (a, b) => Number(a.sort) - Number(b.sort)
      );
      optionsSorted = [...optionsSorted, ...selectedFiltersSorted]
      let otherfiltersSorted = otherfilters.sort(
        (a, b) => Number(a.sort) - Number(b.sort)
      );
      optionsSorted = [...optionsSorted, ...otherfiltersSorted]
      let disabledFiltersSorted = disabledFilters.sort(
        (a, b) => Number(a.sort) - Number(b.sort)
      );
      optionsSorted = [...optionsSorted, ...disabledFiltersSorted]

      filtersFinal.push({
        type: "checkbox",
        spec_id: spec.specid,
        name: specslugData,
        sort: spec.specsort || 0,
        is_filter_group: false,
        title: spec.name,
        tooltip: null,
        options: optionsSorted,
        isTrueFale: false,
      });
    }
    let filtersFinalSorted = filtersFinal.sort(
      (a, b) => Number(a.sort) - Number(b.sort)
    );
    searchLog("success");
    res.status(200).json(filtersFinalSorted);
  } catch (err) {
    res.status(404).send({ error: err.toString() });
  }
});

router.get("/update-products", async (req, res) => {
  try {
    let catalogUpdate = await updateData();
    if (catalogUpdate.status === 200)
      {
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
      res.status(200).send(catalogUpdate);
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
      res.status(200).send(catalogUpdate);
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
      res.status(200).send(catalogUpdate);
    } else {
      throw new Error("Update branches data error: ", catalogUpdate.error);
    }
  } catch (err) {
    console.log("CATCH: " + err);
    res.status(500).send({ error: err.toString() });
  }
});

router.get("/update-costs", async (req, res) => {
  try {
    let catalogUpdate = await updateCosts();
    if (catalogUpdate.status === 200) {      
      res.status(200).send(catalogUpdate);
    } else {
      throw new Error("Update costs data error: ", catalogUpdate.error);
    }
  } catch (err) {
    console.log("CATCH: " + err);
    res.status(500).send({ error: err.toString() });
  }
});

router.get("/update-stocks", async (req, res) => {
  try {
    const catalogUpdate = await updateStocks();
    if (catalogUpdate.status === 200) {     
      res.status(200).send(catalogUpdate);
    } else {
      throw new Error("Update stocks data error: ", catalogUpdate.error);
    }
  } catch (err) {
    console.log("CATCH: " + err);
    res.status(500).send({ error: err.toString() });
  }
});

router.get("/product/:id/:slug", async (req, res) => {
  const { id, slug } = req.params;
  const { city_id, locale } = req.query;
  try {    
    const catalogUpdate = await updateStocks();
    if (catalogUpdate.status === 200) {     
      res.status(200).send(catalogUpdate);
    } else {
      throw new Error("Update stocks data error: ", catalogUpdate.error);
    }
  } catch (err) {
    console.log("CATCH: " + err);
    res.status(500).send({ error: err.toString() });
  }
});

module.exports = router;
