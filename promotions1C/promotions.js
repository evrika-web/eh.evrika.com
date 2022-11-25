const express = require("express");
const router = express.Router();
const axios = require("axios");
const moment = require("moment");
require("dotenv").config();
const { addPromotion } = require("../database/dbQuerie");
const SimpleNodeLogger = require("simple-node-logger");
opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-client.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

router.get("/promotions", async (req, res) => {
  try {
    // console.log('Request for promotions JSON')
    const promotions1C = await getPromotionsfrom1C();

    const cascade = promotions1C.КаскадныеСкидки;

    if (Array.isArray(cascade) && cascade.length > 0) {
      for (var i in cascade) {
        var participateCascade = false;
        if (cascade[i].Участвуют === true) participateCascade = true;
        var dbInsert = await setPromotion(
          cascade[i].Номер,
          "cascade",
          cascade[i].ДатаНачала,
          cascade[i].ДатаОкончания,
          cascade[i].КаскадПроцентСкидки,
          cascade[i].Товары,
          participateCascade
        );
        console.log(dbInsert);
        res.json(dbInsert);
      }
    }
  } catch (err) {
    log.info("/promotions error: " + err);
    res.status(404).send({ error: err.toString() });
  }
});
router.post("/post-promotion", async (req, res) => {
  try {
    // console.log('Request for promotions JSON')
    var result = await setPromotion(req.body)
      res.json(result);
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
      log.info(`Response 1C: ` + error)
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
    log.info('DBinsert ' + err);
    return err;
  }
}
module.exports = { router, getPromotionsfrom1C, setPromotion };
