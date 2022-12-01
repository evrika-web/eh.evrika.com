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
    log.info("POST request /post-promotion for promotions ", req.params);
    console.log("POST request /post-promotion for promotions ", req.params);

    if (req.body) {
      const result = await setPromotion(req.body);
      res.json({ result });
    }
  } catch (err) {
    log.info("/post-promotions error: " + err);
    res.status(404).send({ error: err.toString() });
  }
});
//Данные для запроса в 1С
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
//Получение данных по акциям с 1Ски
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
//маппинг и проверка данных для загрузки в бд
async function promotionsMapping(dataOld, promoName, getActivePromotionsID) {
  var responseData = [];
  try {
    for (var i in dataOld) {
      if (getActivePromotionsID!==undefined&& getActivePromotionsID!==[]&& getActivePromotionsID.includes(dataOld[i].Номер)) continue;
      var participateCascade = true;
      var cascadePercent = [];
      if (dataOld[i].Участвуют !== undefined)
        participateCascade = dataOld[i].Участвуют;
      if (dataOld[i].КаскадПроцентСкидки !== undefined)
        cascadePercent = dataOld[i].КаскадПроцентСкидки;

      var tempData = {
        doc_number: dataOld[i].Номер,
        type: promoName,
        start_date: dataOld[i].ДатаНачала,
        end_date: dataOld[i].ДатаОкончания,
        percents: JSON.stringify(cascadePercent),
        products: JSON.stringify(dataOld[i].Товары),
        participate: participateCascade,
        active: true,
        created_at: moment().format("YYYY-MM-DDTHH:mm:ss"),
        updated_at: moment().format("YYYY-MM-DDTHH:mm:ss"),
      };
      responseData.push(tempData);
    }
    return responseData;
  } catch (err) {
    log.info("promotionsMapping " + err);
    return err;
  }
}
//отправка акций в бд
async function setPromotion(promo) {
  try {
    var activePromotions =  dbQuerie.getActivePromotionsID((promotions) => {
      log.info("GET result /active-promotions for promotions ", promotions);
      return promotions ;
    });
    console.log('activePromotions ', activePromotions)
    var data = [];
    if (promo.КаскадныеСкидки != []) {
      var dataCascade = data.concat(
        await promotionsMapping(
          promo.КаскадныеСкидки,
          "cascade",
          activePromotions
        )
      );
    }
    if (promo.Купоны != []) {
      var dataCoupon = dataCascade.concat(
        await promotionsMapping(promo.Купоны, "coupon", activePromotions)
      );
    }
    if (promo.Промокоды != []) {
      var dataPromocode = dataCoupon.concat(
        await promotionsMapping(promo.Промокоды, "promocode", activePromotions)
      );
    }
    if (dataPromocode != []) {
      dbQuerie.createPromotionData(dataPromocode, (insertPromotions) => {
        log.info(
          "POST result /post-promotion for promotions ",
          insertPromotions
        );
        return insertPromotions;
      });
    } else {
      return "Нет данных для добавления в базу";
    }
  } catch (err) {
    log.info("DBinsert " + err);
    return err;
  }
}

module.exports = router;
