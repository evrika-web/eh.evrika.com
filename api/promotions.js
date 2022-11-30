const express = require("express");
const router = express.Router();
const axios = require("axios");
const moment = require("moment");
require("dotenv").config();
const { addPromotion, getActivePromoID } = require("../database/dbQuerie");

const SimpleNodeLogger = require("simple-node-logger");
const dbQuerie = require("../database/dbQuerie");

opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-client.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

router.get("/active-promotions", async (req, res) => {
  try {
    log.info(
      "GET request /active-promotions for promotions ",
      req.params.filename
    );
    console.log(
      "GET request /active-promotions for promotions ",
      req.params.filename
    );

    dbQuerie.getActivePromotions((promotions) => {
      log.info("GET result /active-promotions for promotions ", promotions);
      res.json({ promotions });
    });
  } catch (err) {
    log.info("/promotions error: " + err);
    res.status(404).send({ error: err.toString() });
  }
});

router.post("/post-promotion", async (req, res) => {
  try {
    log.info(
      "POST request /post-promotion for promotions ",
      req.params.filename
    );
    console.log(
      "POST request /post-promotion for promotions ",
      req.params.filename
    );

    if (req.body) {
      dbQuerie.createPromotionData(req.body, (insertPromotions) => {
        log.info("POST result /post-promotion for promotions ", insertPromotions);
        insertPromotions.forEach(e => {
          e.created_at = moment(e.created_at).format('HH:mm DD-MM-YYYY')
          e.updated_at = moment(e.created_at).format('HH:mm DD-MM-YYYY')
      })
        res.json({ insertPromotions });
      });
    }
  } catch (err) {
    log.info("/post-promotions error: " + err);
    res.status(404).send({ error: err.toString() });
  }
});

const url1CPromotions = process.env.URL_1C_PROMOTIONS;
let data1CPromotions = {
  Акции: "",
  MainDivisionCode: "000000017",
};
let config1CPromotions = {
  headers: {
    auth: {
      username: process.env.USER_1C_PROMOTIONS,
      password: process.env.PASSWORD_1C_PROMOTIONS,
    },
  },
};

async function getPromotionsfrom1C() {
  const result = await axios
    .post(url1CPromotions, data1CPromotions, config1CPromotions)
    .then(function (response) {
      return response.data.Акции;
    })
    .catch(function (error) {
      log.info(`Response 1C: ` + error);
      return error;
    });
  return result;
}

async function setPromotion(promo) {
  try {
    var insertedData = promo.КаскадныеСкидки;
    for (var i in insertedData) {
      var participateCascade = true;
      if (insertedData[i].Участвуют !== undefined)
        participateCascade = insertedData[i].Участвуют;
      var dbInsert = await addPromotion(
        insertedData[i].Номер,
        "cascade",
        insertedData[i].ДатаНачала,
        insertedData[i].ДатаОкончания,
        insertedData[i].КаскадПроцентСкидки,
        insertedData[i].Товары,
        participateCascade
      );
      return dbInsert;
    }
  } catch (err) {
    log.info("DBinsert " + err);
    return err;
  }
}

module.exports = router;
