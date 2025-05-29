const schedule = require("node-schedule");
const moment = require("moment");
const fs = require("fs");

//add functions
const promotionsFunctions = require("../api/promotions/promotionsFunctions");

//add logger
const SimpleNodeLogger = require("simple-node-logger");
const opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-schedule-log-files.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

// Проверка по установленному времени на старые логи
const ruleLogs = new schedule.RecurrenceRule();
ruleLogs.hour = 0;      // Every day at 00:00
ruleLogs.minute = 0;

schedule.scheduleJob(ruleLogs, async () => {
  log.info(moment().format("HH:mm DD-MM-YYYY"), " Time to delete old logs");
  try {
    const dateToDelete = moment().subtract(7, "days").format("DD-MM-YYYY");
    // Delete log files in logs/
    fs.readdir("logs/", (err, files) => {
      if (err) {
        log.error("Error reading logs directory: ", err);
        return;
      }
      files.forEach((file) => {
        const fileDate = file.slice(0, 10);
        if (fileDate <= dateToDelete && file.endsWith(".log")) {
          fs.unlink(`logs/${file}`, (err) => {
            if (err) {
              log.error("Error deleting log file: ", file, err);
            } else {
              log.info("Deleted old log ", file);
            }
          });
        }
        // Also delete ozon folder if it matches the date logic
        const ozonFolderPath = `logs/ozon/${file}`;
        if (
          fs.existsSync(ozonFolderPath) &&
          fs.lstatSync(ozonFolderPath).isDirectory() &&
          fileDate <= dateToDelete
        ) {
          fs.rm(ozonFolderPath, { recursive: true, force: true }, (err) => {
            if (err) {
              log.error("Error deleting ozon folder: ", file, err);
            } else {
              log.info("Deleted old ozon log folder ", file);
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
