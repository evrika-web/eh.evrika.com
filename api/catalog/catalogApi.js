const { default: axios } = require("axios");
const { XMLParser } = require("fast-xml-parser");
const {
  getAllFromCollection,
  replaceOne,
  insertManyData,
  updateOne,
  updateFullCollection,
} = require("../../database/mongo/mongoQuerie");
const { dataFetching } = require("../../utility/dataFetching");
const moment = require("moment");

// DRY helper for updating collections from API
async function updateCollectionFromAPI({ url, collection, auth = null }) {
  try {
    const config = {
      timeout: 300000,
      ...(auth && { auth }),
    };
    const dataFetched = await dataFetching(url, !!auth, config);
    const data = dataFetched.data;
    if (dataFetched.status === 200) {
      if (Array.isArray(data) && data.length !== 0) {
        const updatedData = await updateFullCollection(collection, data);
        if (updatedData.statusResponse === "success") {
          return { status: 200, message: updatedData.message };
        } else {
          throw new Error(
            "Error in transaction update data: " + updatedData.error
          );
        }
      } else {
        throw new Error(`No ${collection} received from the server`);
      }
    } else {
      throw new Error(`Server responded ${JSON.stringify(dataFetched)}`);
    }
  } catch (err) {
    console.error(err);
    return { status: 500, error: err.message || err };
  }
}

async function updateData() {
  try {
    const externalURL =
      process.env.XML_DATA_URL ||
      "https://back.evrika.com/facebook/data-all-new.xml";
    const result = await axios.get(externalURL, {
      headers: { "Accept-Encoding": "*" },
    });
    const XMLdata = result.data;
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      allowBooleanAttributes: true,
      textNodeName: "value",
    });
    const jObj = parser.parse(XMLdata);
    const products = jObj.yml_catalog.shop.offers.offer;
    const allDBids = await getAllFromCollection(
      "products",
      { id: 1, _id: 0 },
      {},
      "all"
    );
    const allDBidsMapped = Array.isArray(allDBids.result)
      ? allDBids.result.map((e) => e.id)
      : [];
    const updateDataArr = [];
    const createDataArr = [];
    let updatedCount = 0;
    const timeUpdate = new Date(moment().format());

    for (let i = 0; i < products.length; i++) {
      const element = products[i];
      element._id = parseInt(element.id);
      element.is_active = Boolean(element.available) ? 1 : 0;
      let cuttedUrl = element.url.split("/catalog/")[1];
      element.slug = cuttedUrl.slice(0, cuttedUrl.indexOf("/p"));
      element.gifts = [];
      element.badges = [];
      if (element.param) {
        element.filter_specifications = element.param;
        for (let index = 0; index < element.filter_specifications.length; ) {
          const spec = element.filter_specifications[index];
          if (spec.name && spec.name.startsWith("badge_")) {
            let badgeId = parseInt(spec.name.split("_")[1]);
            let badge = spec.value.split("||");
            element.badges.push({
              id: badgeId,
              color: spec.color,
              name: badge[0],
              description: null,
              rich_description: null,
              all_products: 0,
            });
            element.filter_specifications.splice(index, 1);
            continue;
          } else if (spec.name === "gifts") {
            element.gifts.push(spec);
            element.filter_specifications.splice(index, 1);
            continue;
          } else if (spec.name === "mpn") {
            element.mpn = spec.value;
            element.filter_specifications.splice(index, 1);
            continue;
          } else if (spec.name === "ean") {
            element.ean = spec.value;
            element.filter_specifications.splice(index, 1);
            continue;
          } else {
            spec.id = parseInt(spec.specid);
            delete spec.specid;
            spec.sort = parseInt(spec.specsort) || 0;
            delete spec.specsort;
          }
          index++;
        }
        delete element.param;
      }
      if (element.locations.location) {
        let templocations = element.locations.location;
        element.locations = Array.isArray(templocations)
          ? templocations
          : [templocations];
        delete element.locations.location;
      }
      if (allDBidsMapped.includes(element.id)) {
        element.updated = timeUpdate;
        updateDataArr.push(element);
        await replaceOne("products", element, { id: element.id });
        updatedCount += 1;
      } else {
        element.created = timeUpdate;
        element.updated = timeUpdate;
        createDataArr.push(element);
      }
    }
    // Обновление недостающих
    const missingIDs = allDBidsMapped.filter(
      (id) => !products.some((obj) => obj.id === id)
    );
    for (const e of missingIDs) {
      await updateOne(
        "products",
        { $set: { available: false, updated: timeUpdate } },
        { _id: parseInt(e) }
      );
      updatedCount += 1;
    }
    let resultCreate = 0;
    if (createDataArr.length !== 0) {
      resultCreate = await insertManyData("products", createDataArr);
    }
    return { status: 200, created: resultCreate, updated: updatedCount };
  } catch (err) {
    console.error(err);
    return { status: 500, error: err.message || err };
  }
}

async function updateCategories() {
  return updateCollectionFromAPI({
    url: "/categories",
    collection: "categories",
  });
}

async function updateCities() {
  return updateCollectionFromAPI({
    url: "/cities",
    collection: "cities",
  });
}

async function updateBranches() {
  return updateCollectionFromAPI({
    url: "/branches",
    collection: "branches",
  });
}

async function updateCosts() {
  return updateCollectionFromAPI({
    url: "http://terrasoft-api.evrika.com/EvrikaOrders/ru_RU/hs/srs/cost",
    collection: "costs",
    auth: {
      username: "HalykEvrika",
      password: "HalykEvrika",
    },
  });
}

async function updateStocks() {
  return updateCollectionFromAPI({
    url: "http://integration.evrika.com/EvrikaOrders/ru_RU/hs/site-api/get_stocks",
    collection: "stocks",
    auth: {
      username: "HalykEvrika",
      password: "HalykEvrika",
    },
  });
}

module.exports = {
  updateData,
  updateCategories,
  updateCities,
  updateBranches,
  updateCosts,
  updateStocks,
};

//Query Helpers
// userSchema.query.byName = function(name) {
//   return this.where({ name: new RegExp(name, 'i') });
// };

// // Usage
// const users = await User.find().byName('john');

//Text Search
// await collection.createIndex({ content: 'text' });

// const results = await collection.find({ $text: { $search: 'mongodb express' } }).toArray();
