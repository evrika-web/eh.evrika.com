const schedule = require("node-schedule");
const moment = require("moment");

//add functions
const promotionsFunctions = require("../api/promotionsFunctions");

//add logger
const SimpleNodeLogger = require("simple-node-logger");
opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-schedule.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

//Проверка по установленному времени на наличие новых акций
schedule.scheduleJob({minute: 55 }, async () => {
  log.info(
    moment().format("HH:mm DD-MM-YYYY"),
    " Time to check new Promotions From 1C"
  );
  try {
    var promo1C = await promotionsFunctions.getPromotionsfrom1C();
    var postPromo = await promotionsFunctions.setPromotion(promo1C);
    log.info(postPromo);
  } catch (err) {
    log.info(err);
    console.log(err);
  }
});

//Проверка по установленному времени на активность акций (старт акции, окончание акции)
schedule.scheduleJob({ minute: 50 }, async () => {
  log.info(
    moment().format("HH:mm DD-MM-YYYY"),
    " Time to check end|start date of promotions"
  );
  try {
    var checkPromos = promotionsFunctions.checkPromotionsActivity();
    log.info(checkPromos);
  } catch (err) {
    log.info("Schedule check end,start date error: ", err);
    console.log(err);
  }
});
