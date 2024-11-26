const { default: axios } = require("axios");
const { XMLParser } = require("fast-xml-parser");
const {
  getAllFromCollection,
  replaceOne,
  insertManyData,
  updateOne,
  updateFullCollection,
} = require("../../database/mongoDb/mongoQuerie");
const { dataFetching } = require("../../utility/dataFetching");
const moment = require("moment");

async function updateData() {
  try {
    let externalURL =
      process.env.XML_DATA_URL ||
      "https://back.evrika.com/facebook/data-all-new.xml";
    let XMLdata;
    let jObj = {};
    await axios(
      externalURL,
      (config = {
        headers: {
          "Accept-Encoding": "*",
        },
      })
    )
      .then((result) => {
        XMLdata = result.data;
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "",
          allowBooleanAttributes: true,
          textNodeName: "value",
        });
        jObj = parser.parse(XMLdata);
      })
      .catch((err) => {
        console.error("[AXIOS]", err.message);
        return { error: err, status: 500 };
      });
    let products = jObj.yml_catalog.shop.offers.offer;
    const allDBids = await getAllFromCollection(
      "products",
      (fields = { id: 1, _id: 0 }),
      (filter = {}),
      (page = "all")
    );
    let allDBidsMapped = [];
    if (Array.isArray(allDBids.result)) {
      allDBids.result.map((e) => {
        allDBidsMapped.push(e.id);
      });
    }
    let updateData = [];
    let createData = [];
    let updatedCount = 0;
    let timeUpdate = new Date(moment().format());
    for (let i = 0; i < products.length; i++) {
      const element = products[i];
      element._id = parseInt(element.id);
      element.is_active = Boolean(element.available) === true ? 1 : 0;
      let cuttedUrl = element.url.split("/catalog/")[1];
      element.slug = cuttedUrl.slice(0, cuttedUrl.indexOf("/p"));
      element.gifts = [];
      element.badges = [];
      if (element.param) {
        element.filter_specifications = element.param;
        for (
          let index = 0;
          index < element.filter_specifications.length;
          index++
        ) {
          delete element.filter_specifications[index].priority;
          if (element.filter_specifications[index].name === "badge_0") {
            let badge = element.filter_specifications[index].value.split("||");
            element.badges.push({
              id: 0,
              color: element.filter_specifications[index].color,
              name: badge[0],
              description: null,
              rich_description: null,
              all_products: 0,
            });
            element.filter_specifications.splice(index, 1);
          } else if (element.filter_specifications[index].name === "badge_1") {
            let badge = element.filter_specifications[index].value.split("||");
            element.badges.push({
              id: 1,
              color: element.filter_specifications[index].color,
              name: badge[0],
              description: null,
              rich_description: null,
              all_products: 0,
            });
            element.filter_specifications.splice(index, 1);
          } else if (element.filter_specifications[index].name === "badge_2") {
            let badge = element.filter_specifications[index].value.split("||");
            element.badges.push({
              id: 2,
              color: element.filter_specifications[index].color,
              name: badge[0],
              description: null,
              rich_description: null,
              all_products: 0,
            });
            element.filter_specifications.splice(index, 1);
          } else if (element.filter_specifications[index].name === "badge_3") {
            let badge = element.filter_specifications[index].value.split("||");
            element.badges.push({
              id: 3,
              color: element.filter_specifications[index].color,
              name: badge[0],
              description: null,
              rich_description: null,
              all_products: 0,
            });
            element.filter_specifications.splice(index, 1);
          } else if (element.filter_specifications[index].name === "badge_4") {
            let badge = element.filter_specifications[index].value.split("||");
            element.badges.push({
              id: 4,
              color: element.filter_specifications[index].color,
              name: badge[0],
              description: null,
              rich_description: null,
              all_products: 0,
            });
            element.filter_specifications.splice(index, 1);
          } else if (element.filter_specifications[index].name === "gifts") {
            element.gifts.push(element.filter_specifications[index]);
            element.filter_specifications.splice(index, 1);
          } else if (element.filter_specifications[index].name === "mpn") {
            element.mpn = element.filter_specifications[index].value;
            element.filter_specifications.splice(index, 1);
          } else if (element.filter_specifications[index].name === "ean") {
            element.ean = element.filter_specifications[index].value;
            element.filter_specifications.splice(index, 1);
          } else {
            element.filter_specifications[index].id = parseInt(
              element.filter_specifications[index].specid
            );
            delete element.filter_specifications[index].specid;

            element.filter_specifications[index].sort =
              parseInt(element.filter_specifications[index].specsort) || 0;
            delete element.filter_specifications[index].specsort;
          }
        }
        delete element.param;
      }
      if (element.locations.location) {
        let templocations = element.locations.location;
        //check if type is object?
        if (!Array.isArray(templocations)) {
          element.locations = [templocations];
        } else {
          element.locations = templocations;
        }
        delete element.locations.location;
      }
      if (allDBidsMapped.includes(element.id)) {
        element.updated = timeUpdate;
        updateData.push(element);
        await replaceOne("products", element, { id: element.id });
        updatedCount += 1;
      } else {
        element.created = timeUpdate;
        element.updated = timeUpdate;
        createData.push(element);
      }
    }
    let missingIDs = allDBidsMapped.filter(
      (id) => !products.some((obj) => obj.id === id)
    );
    missingIDs.map(async (e) => {
      await updateOne(
        "products",
        { $set: { available: false, updated: timeUpdate } },
        { _id: parseInt(e) }
      );
      updatedCount += 1;
    });
    let resultCreate = 0;
    if (createData.length !== 0) {
      resultCreate = await insertManyData("products", createData);
    }
    return { status: 200, created: resultCreate, updated: updatedCount };
  } catch (err) {
    console.error(err);
    return { status: 500, error: err };
  }
}

async function updateCategories() {
  try {
    let dataFetched;
    dataFetched = await dataFetching("/categories?locale=ru", false);
    let data = dataFetched.data.categories;
    if (dataFetched.status === 200) {
      if (Array.isArray(data) && data.length !== 0) {
        const updatedData = await updateFullCollection("categories", data);
        if (updatedData.statusResponse === "success") {
          return { status: 200, message: updatedData.message };
        } else {
          throw new Error(
            "Error in transaction update data: ",
            updatedData.error
          );
        }
      } else {
        throw new Error("No categories received from the server");
      }
    } else {
      throw new Error(`Server responded ${dataFetched}`);
    }
  } catch (err) {
    console.error(err);
    return { status: 500, error: err };
  }
}
async function updateCities() {
  try {
    let dataFetched;
    dataFetched = await dataFetching("/cities", false);
    let data = dataFetched.data;
    if (dataFetched.status === 200) {
      if (Array.isArray(data) && data.length !== 0) {
        const updatedData = await updateFullCollection("cities", data);
        if (updatedData.statusResponse === "success") {
          return { status: 200, message: updatedData.message };
        } else {
          throw new Error(
            "Error in transaction update data: ",
            updatedData.error
          );
        }
      } else {
        throw new Error("No cities received from the server");
      }
    } else {
      throw new Error(`Server responded ${dataFetched}`);
    }
  } catch (err) {
    console.error(err);
    return { status: 500, error: err };
  }
}

async function updateBranches() {
  try {
    let dataFetched;
    dataFetched = await dataFetching("/branches", false);

    let data = dataFetched.data;
    if (dataFetched.status === 200) {
      if (Array.isArray(data) && data.length !== 0) {
        const updatedData = await updateFullCollection("branches", data);
        console.log("🚀 ~ updateBranches ~ updatedData:", updatedData)
        if (updatedData.statusResponse === "success") {
          return { status: 200, message: updatedData.message };
        } else {
          throw new Error(
            "Error in transaction update data: ",
            updatedData.error
          );
        }
      } else {
        throw new Error("No branches received from the server");
      }
    } else {
      throw new Error(`Server responded ${dataFetched}`);
    }
  } catch (err) {
    console.error(err);
    return { status: 500, error: err };
  }
}

async function updateCosts() {
  try {
    let dataFetched;
    dataFetched = await dataFetching(
      "http://terrasoft-api.evrika.com/EvrikaOrders/ru_RU/hs/srs/cost",
      true,
      (config = {
        auth: {
          username: "HalykEvrika",
          password: "HalykEvrika",
        },
      })
    );
    let data = dataFetched.data;
    if (dataFetched.status === 200) {
      if (Array.isArray(data) && data.length !== 0) {
        const updatedData = await updateFullCollection("costs", data);
        if (updatedData.statusResponse === "success") {
          return { status: 200, message: updatedData.message };
        } else {
          throw new Error(
            "Error in transaction update data: ",
            updatedData.error
          );
        }
      } else {
        throw new Error("No costs received from the server");
      }
    } else {
      throw new Error(`Server responded ${dataFetched}`);
    }
  } catch (err) {
    console.error(err);
    return { status: 500, error: err };
  }
}

async function updateStocks() {
  try {
    let dataFetched = null
    dataFetched = await dataFetching(
      "http://integration.evrika.com/EvrikaOrders/ru_RU/hs/site-api/get_stocks",
      true,
      (config = {
        auth: {
          username: "HalykEvrika",
          password: "HalykEvrika",
        },
      })
    );
    let data = dataFetched.data;
    if (dataFetched.status === 200) {
      if (Array.isArray(data) && data.length !== 0) {
        const updatedData = await updateFullCollection("stocks", data);
        if (updatedData.statusResponse === "success") {
          return { status: 200, message: updatedData.message };
        } else {
          throw new Error(
            "Error in transaction update data: ",
            updatedData.error
          );
        }
      } else {
        throw new Error("No stocks received from the server");
      }
    } else {
      throw new Error(`Server responded ${dataFetched}`);
    }
  } catch (err) {
    console.error(err);
    return { status: 500, error: err };
  }
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
