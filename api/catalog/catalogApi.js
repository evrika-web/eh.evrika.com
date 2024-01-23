const { default: axios } = require("axios");
const { XMLParser } = require("fast-xml-parser");
const {
  getAllFromCollection,
  insertOneData,
  replaceOne,
  insertManyData,
} = require("../../database/mongoDb/mongoQuerie");
const { dataFetching } = require("../../utility/dataFetching");

async function updateData() {
  try {
    let externalURL =
      process.env.XML_DATA_URL ||
      "https://site.evrika.com/facebook/data-all-new.xml";
    let XMLdata;
    let jObj = {};
    await axios(externalURL)
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
        return ({ error: err.toString(), status:500 });
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

    for (let i = 0; i < products.length; i++) {
      const element = products[i];
      element._id = parseInt(element.id);
      element.slug = element.url.slice(27, element.url.indexOf("/p"));
      if (element.param) {
        element.specs = element.param;
        for (let index = 0; index < element.specs.length; index++) {
          delete element.specs[index].priority;
          if (element.specs[index].badge_0) {
            delete element.specs[index].badge_0;
          } else if (element.specs[index].badge_1) {
            delete element.specs[index].badge_1;
          } else if (element.specs[index].badge_2) {
            delete element.specs[index].badge_2;
          } else if (element.specs[index].badge_3) {
            delete element.specs[index].badge_3;
          } else if (element.specs[index].badge_4) {
            delete element.specs[index].badge_4;
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
      if (element.badges === "") {
        element.badges = [];
      } else if (Array.isArray(element.badges)) {
      }
      if (allDBidsMapped.includes(element.id)) {
        updateData.push(element);
        await replaceOne("products", element, { id: element.id });
        updatedCount += 1;
      } else {
        createData.push(element);
      }
    }

    let resultCreate = 0;
    if (createData.length !== 0) {
      resultCreate = await insertManyData("products", createData);
    }
    return { status: 200, created: resultCreate, updated: updatedCount };
  } catch (err) {
    console.error(err);
    return { status: 500, error: err.toString() };
  }
}

async function updateCategories() {
  try {
    let dataFetched;
    dataFetched = await dataFetching("/categories/menutree", false);
    let data = dataFetched.data
    if (dataFetched.status === 200) {
      if (Array.isArray(data) && data.length !== 0) {
        const allDBids = await getAllFromCollection(
          "categories",
          (fields = { _id: 1 }),
          (filter = {}),
          (page = "all")
        );
        let allDBidsMapped = [];
        if (Array.isArray(allDBids.result)) {
          allDBids.result.map((e) => {
            allDBidsMapped.push(e._id);
          });
        }
        let updatedCount = 0;
        let createdCount = 0;
        for (var i in data) {
          var item = data[i];
          item._id = item.id;
          // If the category is not on DB yet, we add it to DB
          if (!allDBidsMapped.includes(item.id)) {
            await insertOneData("categories", item);
            createdCount += 1;
          } else {
            // If the category is already on DB but has changed its name or parent, we update it
            await replaceOne("categories", item, { _id: item._id });
            updatedCount += 1;
          }
        }
        return { status: 200, created: createdCount, updated: updatedCount };
      } else {
        throw new Error("No categories received from the server");
      }
    } else {
      throw new Error(`Server responded ${data}`);
    }
  } catch (err) {
    console.error(err);
    return { status: 500, error: err.toString() };
  }
}
async function updateCities() {
  try {
    let dataFetched;
    dataFetched = await dataFetching("/cities", false);
    let data = dataFetched.data
    if (dataFetched.status === 200) {
      if (Array.isArray(data) && data.length !== 0) {
        const allDBids = await getAllFromCollection(
          "cities",
          (fields = { _id: 1 }),
          (filter = {}),
          (page = "all")
        );
        let allDBidsMapped = [];
        if (Array.isArray(allDBids.result)) {
          allDBids.result.map((e) => {
            allDBidsMapped.push(e._id);
          });
        }
        let updatedCount = 0;
        let createdCount = 0;
        for (var i in data) {
          var item = data[i];
          item._id = item.id;
          // If the cities is not on DB yet, we add it to DB
          if (!allDBidsMapped.includes(item.id)) {
            await insertOneData("cities", item);
            createdCount += 1;
          } else {
            // If the cities is already on DB but has changed its name or parent, we update it
            await replaceOne("cities", item, { _id: item._id });
            updatedCount += 1;
          }
        }
        return { status: 200, created: createdCount, updated: updatedCount };
      } else {
        throw new Error("No cities received from the server");
      }
    } else {
      throw new Error(`Server responded ${data}`);
    }
  } catch (err) {
    console.error(err);
    return { status: 500, error: err.toString() };
  }
}
async function updateBranches() {
  try {
    let dataFetched;
    dataFetched = await dataFetching("/branches", false);
    let data = dataFetched.data
    if (dataFetched.status === 200) {
      if (Array.isArray(data) && data.length !== 0) {
        const allDBids = await getAllFromCollection(
          "branches",
          (fields = { _id: 1 }),
          (filter = {}),
          (page = "all")
        );
        let allDBidsMapped = [];
        if (Array.isArray(allDBids.result)) {
          allDBids.result.map((e) => {
            allDBidsMapped.push(e._id);
          });
        }
        let updatedCount = 0;
        let createdCount = 0;
        for (var i in data) {
          var item = data[i];
          item._id = item.id;
          // If the cities is not on DB yet, we add it to DB
          if (!allDBidsMapped.includes(item.id)) {
            await insertOneData("branches", item);
            createdCount += 1;
          } else {
            // If the cities is already on DB but has changed its name or parent, we update it
            await replaceOne("branches", item, { _id: item._id });
            updatedCount += 1;
          }
        }
        return { status: 200, created: createdCount, updated: updatedCount };
      } else {
        throw new Error("No branches received from the server");
      }
    } else {
      throw new Error(`Server responded ${data}`);
    }
  } catch (err) {
    console.error(err);
    return { status: 500, error: err.toString() };
  }
}
async function updateCosts() {
  try {
    let dataFetched;
    dataFetched = await dataFetching("http://terrasoft-api.evrika.com/EvrikaOrders/ru_RU/hs/srs/cost", true, {});
    let data = dataFetched.data
    if (dataFetched.status === 200) {
      if (Array.isArray(data) && data.length !== 0) {
        const allDBids = await getAllFromCollection(
          "costs",
          (fields = { _id: 1 }),
          (filter = {}),
          (page = "all")
        );
        let allDBidsMapped = [];
        if (Array.isArray(allDBids.result)) {
          allDBids.result.map((e) => {
            allDBidsMapped.push(e._id);
          });
        }
        let updatedCount = 0;
        let createdCount = 0;
        for (var i in data) {
          var item = data[i];
          item._id = item.id;
          // If the cities is not on DB yet, we add it to DB
          if (!allDBidsMapped.includes(item.id)) {
            await insertOneData("costs", item);
            createdCount += 1;
          } else {
            // If the cities is already on DB but has changed its name or parent, we update it
            await replaceOne("costs", item, { _id: item._id });
            updatedCount += 1;
          }
        }
        return { status: 200, created: createdCount, updated: updatedCount };
      } else {
        throw new Error("No costs received from the server");
      }
    } else {
      throw new Error(`Server responded ${data}`);
    }
  } catch (err) {
    console.error(err);
    return { status: 500, error: err.toString() };
  }
}
module.exports = { updateData, updateCategories, updateCities, updateBranches, updateCosts };
