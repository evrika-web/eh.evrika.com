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

    dbQuerie.getActivePromotions((promotions) => {
      log.info("GET result /active-promotions for promotions ", promotions);
      res.json({ promotions });
    });
  } catch (err) {
    log.info("/promotions error: " + err);
    res.status(404).send({ error: err.toString() });
  }
});
router.get("/check-promotions-activity", async (req, res) => {
  try {
    dbQuerie.checkPromotionsEnd((updatedPromotions) => {
      log.info("GET result /check-promotions-activity for promotions end", updatedPromotions);
      return updatedPromotions;
    });
    dbQuerie.checkPromotionStart((updatedPromotions) => {
      log.info("GET result /check-promotions-activity for promotions start", updatedPromotions);
      return updatedPromotions;
    });
   
    res.send('All promotions is up to date')
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
