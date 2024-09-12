const { default: axios } = require("axios");
const { XMLParser } = require("fast-xml-parser");
const {
  getAllFromCollection,
  replaceOne,
  insertManyData,
  updateOne,
} = require("../../database/mongoDb/mongoQuerie");

//add logger
const SimpleNodeLogger = require("simple-node-logger");
const moment = require("moment");
opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-schedule-HalykAPI.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

async function updateDataFromXMLKaspi() {
  try {
    //parse from xml
    let externalURL =
      process.env.KASPI_XML_DATA_URL ||
      "https://export.evrika.com/api/exchange/evrika/kaspi/xml";
    let username = process.env.KASPI_XML_DATA_LOGIN || "";
    let password = process.env.KASPI_XML_DATA_PASS || "";
    let XMLdata;
    let jObj = {};
    await axios(externalURL, {
      headers: {
        "Accept-Encoding": "*",  // Allow any type of encoding
      },
      auth: {
        username: username,
        password: password,
      },
    })
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
    let products = jObj.kaspi_catalog.offers.offer;

    //get all ids from database
    const allDBids = await getAllFromCollection(
      "kaspi_market",
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

    //get all pickup points
    const allPickupPoints = await getAllFromCollection(
      "pickup_points_marketplace",
      (fields = { _id: 0, store_id: 1, city_id: 1 }),
      (filter = {}),
      (page = "all")
    );
    let updateData = [];
    let createData = [];
    let updatedCount = 0;
    let timeUpdate = new Date(moment().format());
    for (let i = 0; i < products.length; i++) {
      const element = products[i];
      element._id = element.sku;
      if (element.availabilities.availability) {
        let templocations = element.availabilities.availability;
        //check if type is object?
        if (!Array.isArray(templocations)) {
          element.locations = [templocations];
        } else {
          element.locations = templocations;
        }
        delete element.availabilities;
        let matchedData = element.locations
          .map((item) => {
            let match = allPickupPoints.result.find(
              (innerItem) => innerItem.store_id === item.storeId
            );
            delete match?.store_id;
            return match ? { ...item, ...match } : item;
          })
          .filter((item) => item.storeId !== undefined);
        element.locations = matchedData;
      }
      if (allDBidsMapped.includes(element._id)) {
        element.updated = timeUpdate;
        updateData.push(element);
        await replaceOne("kaspi_market", element, { _id: element._id });
        updatedCount += 1;
      } else {
        element.created = timeUpdate;
        element.updated = timeUpdate;
        createData.push(element);
      }
    }
    let missingIDs = allDBidsMapped.filter(
      (_id) => !products.some((obj) => obj._id === _id)
    );
    missingIDs.map(async (e) => {
      await updateOne(
        "kaspi_market",
        { $set: { available: false, updated: timeUpdate } },
        { _id: parseInt(e) }
      );
      updatedCount += 1;
    });
    let resultCreate = 0;
    if (createData.length !== 0) {
      resultCreate = await insertManyData("kaspi_market", createData);
    }
    return { status: 200, created: resultCreate, updated: updatedCount };
  } catch (err) {
    console.error(err);
    return { status: 500, error: err };
  }
}

module.exports = {
  updateDataFromXMLKaspi,
};
