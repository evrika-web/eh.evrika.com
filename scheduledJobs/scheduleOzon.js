const schedule = require("node-schedule");
const moment = require("moment");
//add logger
const SimpleNodeLogger = require("simple-node-logger");
const { updateStockCostOzon } = require("../api/ozonMarket/ozonMarketApi");

const opts = {
  logFilePath: `logs/ozon/${moment().format("DD-MM-YYYY")}-schedule-ozon.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

// Обновление данных в Ozon по товарам
schedule.scheduleJob('0 * * * *', async () => {
  const start = Date.now();
  log.info(moment().format("HH:mm DD-MM-YYYY "), "Hourly update Ozon");
  try {
    const catalogUpdate = await updateStockCostOzon();
    // Предполагается, что updateStockCostOzon возвращает объект с полями status, created, updated, error
    if (catalogUpdate && catalogUpdate.status === 200) {
      const end = Date.now();
      log.info("Hourly update Ozon log ", {
        created: catalogUpdate.created,
        updated: catalogUpdate.updated,
        time: `Execution time: ${end - start}ms`,
      });
    } else {
      log.error("Hourly update Ozon error: ", catalogUpdate && catalogUpdate.error);
    }
  } catch (err) {
    log.error("Exception in hourly update Ozon: ", err);
  }
});