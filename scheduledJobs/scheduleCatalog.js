const schedule = require("node-schedule");
const moment = require("moment");
//add logger
const SimpleNodeLogger = require("simple-node-logger");
const { getAppLog } = require("../utility/appLoggers");
const {
  updateData,
  updateCategories,
  updateCities,
  updateBranches,
  updateCosts,
  updateStocks,
} = require("../api/catalog/catalogApi");
const { updateDataFromXML } = require("../api/halykMarket/halykmarketApi");
const { updateDataFromXMLKaspi } = require("../api/kaspiMarket/kaspiMarketApi");

opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-schedule-catalog.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

//Обновление данных по товарам
// schedule.scheduleJob('*/30 * * * *', async () => {
//   const start = new Date().getTime();
//   log.info(moment().format("HH:mm DD-MM-YYYY "), "Daily update data");
//   let catalogUpdate = await updateData();
//   if (catalogUpdate.status === 200) {
//     const end = new Date().getTime();
//     log.info("Daily update products log ", {
//       created: catalogUpdate.created,
//       updated: catalogUpdate.updated,
//       time: `Execution time: ${end - start}ms`,
//     });
//   } else {
//     log.error("Daily update products data error: ", catalogUpdate.error);
//   }
// });

//Обновление данных по категориям
schedule.scheduleJob({ hour: 1 }, async () => {
  const start = new Date().getTime();
  log.info(moment().format("HH:mm DD-MM-YYYY "), "Daily update categories");
  let catalogUpdate = await updateCategories();
  if (catalogUpdate.status === 200) {
    const end = new Date().getTime();
    log.info("Daily update categories log ", {
      created: catalogUpdate.created,
      updated: catalogUpdate.updated,
      time: `Execution time: ${end - start}ms`,
    });
  } else {
    log.error("Daily update categories data error: ", catalogUpdate.error);
  }
});

//Обновление данных по городам
schedule.scheduleJob({ hour: 1 }, async () => {
  const start = new Date().getTime();
  log.info(moment().format("HH:mm DD-MM-YYYY"), "Daily update cities");
  let catalogUpdate = await updateCities();
  if (catalogUpdate.status === 200) {
    const end = new Date().getTime();
    log.info("Daily update cities log ", {
      created: catalogUpdate.created,
      updated: catalogUpdate.updated,
      time: `Execution time: ${end - start}ms`,
    });
  } else {
    log.error("Daily update cities data error: ", catalogUpdate.error);
  }
});

//Обновление данных по городам
schedule.scheduleJob({ hour: 1 }, async () => {
  const start = new Date().getTime();
  log.info(moment().format("HH:mm DD-MM-YYYY "), "Daily update branches");
  let catalogUpdate = await updateBranches();
  if (catalogUpdate.status === 200)
  {
    const end = new Date().getTime();
    log.info("Daily update branches log ", {
      created: catalogUpdate.created,
      updated: catalogUpdate.updated,
      time: `Execution time: ${end - start}ms`,
    });
  }
  else {
    log.error("Daily update branches data error: ", catalogUpdate.error);
  }
});

//Обновление данных по товарам halyk
schedule.scheduleJob({ hour: 1 }, async () => {
  const start = new Date().getTime();
  log.info(moment().format("HH:mm DD-MM-YYYY "), "Daily update data halyk");
  let catalogUpdate = await updateDataFromXML();
  if (catalogUpdate.status === 200) {
    const end = new Date().getTime();
    log.info("Daily update products halyk log ", {
      created: catalogUpdate.created,
      updated: catalogUpdate.updated,
      time: `Execution time: ${end - start}ms`,
    });
  } else {
    log.error("Daily update products halyk data error: ", catalogUpdate.error);
  }
});

//Обновление данных по товарам kaspi
schedule.scheduleJob({ hour: 1 }, async () => {
  const start = new Date().getTime();
  log.info(moment().format("HH:mm DD-MM-YYYY "), "Daily update data kaspi");
  let catalogUpdate = await updateDataFromXMLKaspi();
  if (catalogUpdate.status === 200) {
    const end = new Date().getTime();
    log.info("Daily update products kaspi log ", {
      created: catalogUpdate.created,
      updated: catalogUpdate.updated,
      time: `Execution time: ${end - start}ms`,
    });
  } else {
    log.error("Daily update products kaspi data error: ", catalogUpdate.error);
  }
});

// //Обновление данных по ценам товара
// schedule.scheduleJob('*/30 * * * *', async () => {
//   const start = new Date().getTime();
//   log.info(moment().format("HH:mm DD-MM-YYYY "), "Daily update costs");
//   let catalogUpdate = await updateCosts();
//   if (catalogUpdate.status === 200) {
//     const end = new Date().getTime();
//     log.info("Daily update costs log ", {
//       created: catalogUpdate.created,
//       updated: catalogUpdate.updated,
//       time: `Execution time: ${end - start}ms`,
//     });
//   } else {
//     log.error("Daily update costs data error: ", catalogUpdate.error);
//   }
// });

// //Обновление данных по стокам товара
// schedule.scheduleJob('15,45 * * * *', async () => {
//   const start = new Date().getTime();
//   log.info(moment().format("HH:mm DD-MM-YYYY "), "Daily update stocks");
//   let catalogUpdate = await updateStocks();
//   if (catalogUpdate.status === 200) {
//     const end = new Date().getTime();
//     log.info("Daily update stocks log ", {
//       created: catalogUpdate.created,
//       updated: catalogUpdate.updated,
//       time: `Execution time: ${end - start}ms`,
//     });
//   } else {
//     log.error("Daily update stocks data error: ", catalogUpdate.error);
//   }
// });