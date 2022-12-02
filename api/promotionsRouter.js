const express = require("express");
const router = express.Router();
const moment = require("moment");
require("dotenv").config();

const SimpleNodeLogger = require("simple-node-logger");
const dbQuerie = require("../database/dbQuerie");
const promotionsFunctions = require("./promotionsFunctions");

opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-client.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

router.get("/active-promotions", async (req, res) => {
  try {
    var activePromotionsData = await promotionsFunctions.getActivePromotions('data');
    console.log(activePromotionsData);
    res.json({activePromotionsData}) ;
  } catch (err) {
    log.info("/promotions error: " + err);
    res.status(404).send({ error: err.toString() });
  }
});
router.get("/add-promotions-from-1c", async (req, res) => {
  try {
    var promo1C = await promotionsFunctions.getPromotionsfrom1C();
    var postPromo = await promotionsFunctions.
    (promo1C);
    console.log(postPromo)
    res.send(postPromo);
  } catch (err) {
    log.info("/promotions error: " + err);
    res.status(404).send({ error: err.toString() });
  }
});
router.get("/check-promotions-activity", async (req, res) => {
  try {
    var checkPromo = await promotionsFunctions.checkPromotionsActivity();   
    res.send(checkPromo)
  } catch (err) {
    log.info("/promotions error: " + err);
    res.status(404).send({ error: err.toString() });
  }  
});

router.post("/post-promotion", async (req, res) => {
  try {

    if (req.body) {
      const result = await promotionsFunctions.setPromotion(req.body);
      res.json({ result });
    }
  } catch (err) {
    log.info("/post-promotions error: " + err);
    res.status(404).send({ error: err.toString() });
  }
});
module.exports = router;
