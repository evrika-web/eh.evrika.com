const schedule = require("node-schedule");
const moment = require("moment");
const fs = require("fs");

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
    log.info(postPromo);
  } catch (err) {
    log.info(err);
    console.log(err);
  }
});

var ruleCheckDates = new schedule.RecurrenceRule();
ruleCheckDates.hour = 2;
ruleCheckDates.minutes = 55;
//Проверка по установленному времени на активность акций (старт акции, окончание акции)
schedule.scheduleJob(ruleCheckDates, async () => {
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


//Проверка по установленному времени на старые логи
schedule.scheduleJob({hour: 03}, async () => {
  log.info(moment().format("HH:mm DD-MM-YYYY"), " Time to delete old logs");
  try {
    const dateToDelete = moment().subtract(7, "days").format("DD-MM-YYYY");
    const fileNames = fs.readdir("logs/", (err, files) => {
      // console.log("files ", files);
      files.forEach((file) => {
        var fileDate = file.slice(0, 10);
        if (fileDate <= dateToDelete) {
          fs.unlink(`logs/` + file, (err) => {
            if (err) {
              console.log("err ", err);
              throw err;
            } else {
              log.info("Deleted old log ", file);
            }
          });
        }
      });
    });
  } catch (err) {
    log.info("deletion of old logs error: ", err);
    console.log(err);
  }
});
