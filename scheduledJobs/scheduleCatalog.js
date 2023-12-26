const schedule = require("node-schedule");
const moment = require("moment");
//add logger
const SimpleNodeLogger = require("simple-node-logger");
const { getAppLog } = require("../utility/appLoggers");
const updateData = require("../api/catalog/catalogApi");

opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-schedule-catalog.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

//Обновление данных по товарам
schedule.scheduleJob({ hour: 2 }, async () => {
  log.info(moment().format("HH:mm DD-MM-YYYY"), "Daily update data");
  let catalogUpdate = await updateData();
  if (catalogUpdate.status === 200)
    log.info("Daily update log ", {
      created: catalogUpdate.created,
      updated: catalogUpdate.updated,
    });
  else {
    log.error("Daily update data error: ", catalogUpdate.error);
  }
});
