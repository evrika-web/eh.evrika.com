const { default: axios } = require("axios");
const { XMLParser } = require("fast-xml-parser");
const {
  getAllFromCollection,
  insertOneData,
  replaceOne,
  insertManyData,
  update,
  updateOne,
} = require("../../database/mongoDb/mongoQuerie");
const { dataFetching } = require("../../utility/dataFetching");

//add logger
const SimpleNodeLogger = require("simple-node-logger");
const moment = require("moment");
opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-schedule-catalogAPI.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

async function updateData() {
  try {
    let externalURL =
      process.env.XML_DATA_URL ||
      "https://site.evrika.com/facebook/data-all-new.xml";
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
      element.available = Boolean(element.available);
      let cuttedUrl = element.url.split("/catalog/")[1];
      element.slug = cuttedUrl.slice(0, cuttedUrl.indexOf("/p"));
      element.gifts = [];
      element.badges = [];
      if (element.param) {
        element.specs = element.param;
        for (let index = 0; index < element.specs.length; index++) {
          delete element.specs[index].priority;
          if (element.specs[index].name === "badge_0") {
            let badge = element.specs[index].value.split("||");
            element.badges.push({
              id: 0,
              sort: 0,
              published: true,
              color: element.specs[index].color,
              name: badge[0],
            });
            element.specs.splice(index, 1);
          } else if (element.specs[index].name === "badge_1") {
            let badge = element.specs[index].value.split("||");
            element.badges.push({
              id: 1,
              sort: 1,
              published: true,
              color: element.specs[index].color,
              name: badge[0],
            });
            element.specs.splice(index, 1);
          } else if (element.specs[index].name === "badge_2") {
            let badge = element.specs[index].value.split("||");
            element.badges.push({
              id: 2,
              sort: 2,
              published: true,
              color: element.specs[index].color,
              name: badge[0],
            });
            element.specs.splice(index, 1);
          } else if (element.specs[index].name === "badge_3") {
            let badge = element.specs[index].value.split("||");
            element.badges.push({
              id: 3,
              sort: 3,
              published: true,
              color: element.specs[index].color,
              name: badge[0],
            });
            element.specs.splice(index, 1);
          } else if (element.specs[index].name === "badge_4") {
            let badge = element.specs[index].value.split("||");
            element.badges.push({
              id: 4,
              sort: 4,
              published: true,
              color: element.specs[index].color,
              name: badge[0],
            });
            element.specs.splice(index, 1);
          } else if (element.specs[index].name === "gifts") {
            element.gifts.push(element.specs[index]);
            element.specs.splice(index, 1);
          } else if (element.specs[index].name === "mpn") {
            element.mpn = element.specs[index].value;
            element.specs.splice(index, 1);
          } else if (element.specs[index].name === "ean") {
            element.ean = element.specs[index].value;
            element.specs.splice(index, 1);
          } else {
            element.specs[index].specid = parseInt(element.specs[index].specid);
            element.specs[index].valuesort = parseInt(
              element.specs[index].valuesort
            );
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
    dataFetched = await dataFetching("/categories/menutree", false);
    log.info(
      moment().format("HH:mm DD-MM-YYYY"),
      " Update categories ",
      dataFetched
    );
    let data = dataFetched.data;
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
    log.info(
      moment().format("HH:mm DD-MM-YYYY"),
      "Update cities ",
      dataFetched
    );
    let data = dataFetched.data;
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
    log.info(
      moment().format("HH:mm DD-MM-YYYY"),
      "Update branches ",
      dataFetched
    );
    let data = dataFetched.data;
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
};
