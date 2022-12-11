const express = require("express");
const router = express.Router();
const moment = require("moment");
require("dotenv").config();

const SimpleNodeLogger = require("simple-node-logger");
const promotionsFunctions = require("./promotionsFunctions");
const dbQuerie=require('../database/dbQuerie')

opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-client.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

//get active promotions data
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

//add promotions from 1C to db
router.get("/add-promotions-from-1c", async (req, res) => {
  try {
    var promo1C = await promotionsFunctions.getPromotionsfrom1C();
    var postPromo = await promotionsFunctions.setPromotion(promo1C);
    res.send(postPromo);
  } catch (err) {
    log.info("/promotions error: " + err);
    res.status(404).send({ error: err.toString() });
  }
});

//check activity of promotions start, end date
router.get("/check-promotions-activity", async (req, res) => {
  try {
    var checkPromo = await promotionsFunctions.checkPromotionsActivity();   
    res.send(checkPromo)
  } catch (err) {
    log.info("/promotions error: " + err);
    res.status(404).send({ error: err.toString() });
  }  
});

//post promotions to db
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

//check if productexsist in cascade
router.post("/check-product-exist", async (req, res) => {
  try {

    if (req.body) {
      // const result = await dbQuerie.productExistCascade(req.body.article);
      var resulCheck
      await dbQuerie.productExistCascade(req.body.article, (result) => {
        log.info(
          "POST result /check-product-exist for promotions ",
          result
        );
        resulCheck = result
      }); 
      res.json({ resulCheck });
    }
  } catch (err) {
    log.info("/check-product-exist error: " + err);
    res.status(404).send({ error: err.toString() });
  }
});
//check cart for promotions
router.post("/check-cart", async (req, res) => {
  try {

    if (req.body) {
      const result = await promotionsFunctions.setPromotion(req.body.cart);
      res.json({ result });
    }
  } catch (err) {
    log.info("/post-promotions error: " + err);
    res.status(404).send({ error: err.toString() });
  }
});
module.exports = router;
