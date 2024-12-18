const express = require("express");
const router = express.Router();
const moment = require("moment");
require("dotenv").config();

const SimpleNodeLogger = require("simple-node-logger");
const promotionsFunctions = require("../api/promotions/promotionsFunctions");
const promotionsCheckCart = require("../api/promotions/promotionsCheckCart");
const dbQuerie = require("../database/mySQL/dbQuerie");


opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-api.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

//get active promotions data
router.get("/active-promotions-data", async (req, res) => {
  try {
    var activePromotionsData = await promotionsFunctions.getActivePromotions('data');
    res.json({activePromotionsData}) ;
  } catch (err) {
    log.error("/active-promotions-data error: " + err);
    res.status(404).send({ error: err.toString() });
  }
});

//get active promotions id
router.get("/active-promotions-id", async (req, res) => {
  try {
    var activePromotionsData = await promotionsFunctions.getActivePromotions('id');
    res.json({activePromotionsData}) ;
  } catch (err) {
    log.error("/active-promotions-id error: " + err);
    res.status(404).send({ error: err.toString() });
  }
});

//Добавление акций с 1С
router.get("/add-promotions-from-1c", async (req, res) => {
  try {
    var promo1C = await promotionsFunctions.getPromotionsfrom1C();
    
    var postPromo = await promotionsFunctions.setPromotion(promo1C);
    res.send(postPromo);
  } catch (err) {
    log.error("/add-promotions-from-1c error: " + err);
    res.status(404).send({ error: err.toString() });
  }
});

//Проверка на активность акции (Старт акции, конец акции)
router.get("/check-promotions-activity", async (req, res) => {
  try {
    var checkPromo = await promotionsFunctions.checkPromotionsActivity();   
    res.send(checkPromo)
  } catch (err) {
    log.error("/check-promotions-activity error: " + err);
    res.status(404).send({ error: err.toString() });
  }  
});

//Добавление акции в БД
router.post("/post-promotion", async (req, res) => {
  try {

    if (req.body) {
      const result = await promotionsFunctions.setPromotion(req.body);
      res.json({ result });
    }
  } catch (err) {
    log.error("/post-promotions error: " + err);
    res.status(404).send({ error: err.toString() });
  }
});

//Проверка на наличие товара в каскадных исключениях
router.post("/check-product-exist", async (req, res) => {
  try {
    if (req.body) {
      // const result = await dbQuerie.productExistCascade(req.body.article);
      var resulCheck
      await dbQuerie.productExistCascade(req.body.article,async  (result) => {
      }); 
      res.json({ resulCheck });
    }
  } catch (err) {
    log.error("/check-product-exist error: " + err);
    res.status(404).send({ error: err.toString() });
  }
});

//проверка корзины на наличие акции каскад
router.post("/check-cart", async (req, res) => {
  try {
    if (req.body) {
      const result = await promotionsCheckCart.checkCart(req.body.cart);
      if(result.err==false && result.cascadeCart){
       res.status(200).send({ cascadeCart: result.cascadeCart, oldCostDiscount: result.oldCostDiscount, cascadeDiscount: result.cascadeDiscount, totalDiscount: result.oldCostDiscount+ result.cascadeDiscount, cartSum: result.cartSum, cart: result.cart  });
      }
      else if(result.err==true && result.errMessage=="Something went wrong" ){
        log.error("/check-cart error: " + JSON.stringify({ cascadeCart: false, message: result.errMessage }));
        res.status(404).send({ cascadeCart: false, message: result.errMessage });
      }
      else if(result.err==true ){
        res.status(200).send({ cascadeCart: false, cart: result.cart, message: result.errMessage });
      }
      else{
         res.status(200).send({ cascadeCart: result.cascadeCart, oldCostDiscount: result.oldCostDiscount, cascadeDiscount: result.cascadeDiscount, totalDiscount: result.oldCostDiscount+ result.cascadeDiscount, cartSum: result.cartSum, cart:result.cart });
      }
    }
  } catch (err) {
    log.error("/check-cart error: " + err);
    res.status(404).send({ cascadeCart: false, message: err.toString() });
  }
});

module.exports = router;
