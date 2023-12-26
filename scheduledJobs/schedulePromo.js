const schedule = require("node-schedule");
const moment = require("moment");
const fs = require("fs");

//add functions
const promotionsFunctions = require("../api/promotions/promotionsFunctions");

//add logger
const SimpleNodeLogger = require("simple-node-logger");
opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-schedule-promo.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

//Проверка по установленному времени на наличие новых акций
var ruleNewPromos = new schedule.RecurrenceRule();
ruleNewPromos.hour = 2;
ruleNewPromos.minutes = 50;

schedule.scheduleJob(ruleNewPromos, async () => {
  log.info(
    moment().format("HH:mm DD-MM-YYYY"),
    " Time to check new Promotions From 1C"
  );
  try {
    var promo1C = await promotionsFunctions.getPromotionsfrom1C();
    var postPromo = await promotionsFunctions.setPromotion(promo1C);
    log.error("Time to check new Promotions From 1C error: ", postPromo);
  } catch (err) {
    log.error(err);
    console.log(err);
  }
});