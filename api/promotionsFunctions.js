const axios = require("axios");
const moment = require("moment");
require("dotenv").config();

const SimpleNodeLogger = require("simple-node-logger");
const dbQuerie = require("../database/dbQuerie");

opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-promotions-functions.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);
//Данные для запроса в 1С
const url1CPromotions = process.env.URL_1C_PROMOTIONS;
let data1CPromotions = {
  Акции: "",
  MainDivisionCode: "HQ1000022",
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
  try {
    var responseData = [];
    var currDate = moment().format("YYYY-MM-DDTHH:mm:ss");

    for (var i in dataOld) {
      if (
        getActivePromotionsID !== undefined &&
        getActivePromotionsID !== [] &&
        getActivePromotionsID.includes(dataOld[i].Номер)
      )
        continue;
      if (dataOld[i].ДатаОкончания < currDate) continue;
      var active = false;
      if (dataOld[i].ДатаНачала < currDate) active = true;
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
        active: active,
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
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
    var activePromotionsDB = await getActivePromotions("id");
    var activePromotions = [];
    for (var i in activePromotionsDB) {
      activePromotions.push(activePromotionsDB[i].doc_number);
    }
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
    if (dataPromocode.length == 0) {
      return "Нет данных для добавления в базу";
    } else {
        var resulInsert
      await dbQuerie.createPromotionData(dataPromocode, (insertPromotions) => {
        log.info(
          "POST result /post-promotion for promotions ",
          insertPromotions
        );
        resulInsert = insertPromotions
      });      
      return 'Акции обновлены, последний добавленный id: ' + resulInsert;
    }
  } catch (err) {
    log.info("DBinsert " + err);
    return err;
  }
}
//Проверка на активность акций
async function checkPromotionsActivity() {
  try {
    await dbQuerie.checkPromotionsEnd((updatedPromotions) => {
      log.info(
        "GET result /check-promotions-activity for promotions end",
        updatedPromotions
      );
    });
    await dbQuerie.checkPromotionStart((updatedPromotions) => {
      log.info(
        "GET result /check-promotions-activity for promotions start",
        updatedPromotions
      );
    });
    return "All promotions is up to date";
  } catch (err) {
    log.info("Check prmotions activity err " + err);
    return err;
  }
}
//Получение активных акций all data /only id
async function getActivePromotions(type) {
  try {
    var resultData;
    switch (type) {
      case "data":
        await dbQuerie.getActivePromotions((promotions) => {
          resultData = promotions;
        });
        break;

      default:
        await dbQuerie.getActivePromotionsID((promotionsIDs) => {
          resultData = promotionsIDs;
        });
        break;
    }
    return resultData;
  } catch (err) {
    log.info("Check promotions activity " + err);
    return err;
  }
}

module.exports = {
  setPromotion,
  promotionsMapping,
  getPromotionsfrom1C,
  checkPromotionsActivity,
  getActivePromotions,
};
