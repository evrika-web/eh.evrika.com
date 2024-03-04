const express = require("express");
const router = express.Router();
const moment = require("moment");
require("dotenv").config();
const SimpleNodeLogger = require("simple-node-logger");
const { getOneFromCollectionByFilter } = require("../database/mongoDb/mongoQuerie");
const {} = require("../api/catalog/catalogApi");
const { updateDataFromXML } = require("../api/halykMarket/halykmarketApi");

opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-halyk-market.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

router.get("/update-products", async (req, res) => {
  try {
    let halykMarketUpdate = await updateDataFromXML();
    if (halykMarketUpdate.status === 200) {
      log.info("Update products log ", {
        created: halykMarketUpdate.created,
        updated: halykMarketUpdate.updated,
      });
      res.status(200).json({
        created: halykMarketUpdate.created,
        updated: halykMarketUpdate.updated,
      });
    } else {
      throw new Error("Update products data error: ", halykMarketUpdate);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: err.toString() });
  }
});

router.get("/check-product/:productArticle/:cityId", async (req, res) => {
  const { productArticle, cityId } = req.params;
  var conditions = {
    $and: [{ _id: productArticle }, { ["locations.availability"]: cityId }],
  };
  try {
    var data = await getOneFromCollectionByFilter(
      "halyk_market",
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
