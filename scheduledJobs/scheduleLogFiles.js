const schedule = require("node-schedule");
const moment = require("moment");
const fs = require("fs");

//add functions
const promotionsFunctions = require("../api/promotions/promotionsFunctions");

//add logger
const SimpleNodeLogger = require("simple-node-logger");
opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-schedule-log-files.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

//Проверка по установленному времени на старые логи
var ruleLogs = new schedule.RecurrenceRule();
ruleLogs.hour = 3;
schedule.scheduleJob(ruleLogs, async () => {
  log.info(moment().format("HH:mm DD-MM-YYYY"), " Time to delete old logs");
  try {
    const dateToDelete = moment().subtract(7, "days").format("DD-MM-YYYY");
    fs.readdir("logs/", (err, files) => {
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
    log.error("deletion of old logs error: ", err);
    console.log(err);
  }
});
