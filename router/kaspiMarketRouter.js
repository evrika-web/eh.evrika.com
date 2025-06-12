const express = require("express");
const router = express.Router();
const moment = require("moment");
require("dotenv").config();
const SimpleNodeLogger = require("simple-node-logger");
const { getOneFromCollectionByFilter } = require("../database/mongo/mongoQuerie");
const {} = require("../api/catalog/catalogApi");
const { updateDataFromXMLKaspi } = require("../api/kaspiMarket/kaspiMarketApi");

opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-kaspi-market.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

router.get("/update-products", async (req, res) => {
  try {
    let kaspiUpdate = await updateDataFromXMLKaspi();
    if (kaspiUpdate.status === 200) {
     
      res.status(200).json({
        created: kaspiUpdate.created,
        updated: kaspiUpdate.updated,
      });
    } else {
      throw new Error("Update products data error: ", kaspiUpdate);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: err.toString() });
  }
});

router.get("/check-product/:productArticle/:cityId", async (req, res) => {
  const { productArticle, cityId } = req.params;
  var conditions = {
    $and: [{ _id: productArticle }, { ["locations.city_id"]: parseInt(cityId) }],
  };
  try {
    var data = await getOneFromCollectionByFilter(
      "kaspi_market",
      (filter = conditions)
    );
    if (data) {
      res.json({ productExist: true });
    } else {
      res.status(404).send({ productExist: false });
    }
  } catch (err) {
    res.status(500).send({ error: err.toString() });
  }
});

module.exports = router;
