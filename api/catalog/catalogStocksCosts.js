//add logger
const SimpleNodeLogger = require("simple-node-logger");
const moment = require("moment");
const { dataFetching } = require("../../utility/dataFetching");

async function updateStocks() {
  opts = {
    logFilePath: `logs/${moment().format("DD-MM-YYYY")}-catalog-stocks.log`,
    timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
  };
  const log = SimpleNodeLogger.createSimpleLogger(opts);
  log.info(moment().format("HH:mm DD-MM-YYYY"), "Update stocks", dataFetched);

  try {
    
    let dataFetched;
    dataFetched = await dataFetching(
      process.env.ONEC_URL ||
      "http://integration.evrika.com/EvrikaOrders/ru_RU/hs/site-api/get_stocks",
      true,
      {}
    );
    const groupedByGuid = stockData.reduce((acc, item) => {
      // Если в аккумуляторе еще нет ключа для этого guid, создаем пустой массив
      if (!acc[item.guid]) {
        acc[item.guid] = [];
      }
      // Добавляем элемент в соответствующий массив
      acc[item.guid].push(item);
      return acc;
    }, {});

    return { status: 200, created: 0, updated: 0 };
  } catch (err) {
    console.error(err);
    return { status: 500, error: err };
  }
}

async function updateCosts() {
  opts = {
    logFilePath: `logs/${moment().format("DD-MM-YYYY")}-catalog-stocks.log`,
    timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
  };
  const log = SimpleNodeLogger.createSimpleLogger(opts);
  try {
    let dataFetched;
    dataFetched = await dataFetching(
      "http://terrasoft-api.evrika.com/EvrikaOrders/ru_RU/hs/srs/cost",
      true,
      {}
    );
    log.info(moment().format("HH:mm DD-MM-YYYY"), "Update costs ", dataFetched);
    let data = dataFetched.data;
    if (dataFetched.status === 200) {
      if (Array.isArray(data) && data.length !== 0) {
        const allDBids = await getAllFromCollection(
          "costs",
          (fields = { _id: 1 }),
          (filter = {}),
          (page = "all")
        );
        let allDBidsMapped = [];
        if (Array.isArray(allDBids.result)) {
          allDBids.result.map((e) => {
            allDBidsMapped.push(e._id);
          });
        }
        let updatedCount = 0;
        let createdCount = 0;
        for (var i in data) {
          var item = data[i];
          item._id = item.id;
          // If the cities is not on DB yet, we add it to DB
          if (!allDBidsMapped.includes(item.id)) {
            await insertOneData("costs", item);
            createdCount += 1;
          } else {
            // If the cities is already on DB but has changed its name or parent, we update it
            await replaceOne("costs", item, { _id: item._id });
            updatedCount += 1;
          }
        }
        return { status: 200, created: createdCount, updated: updatedCount };
      } else {
        throw new Error("No costs received from the server");
      }
    } else {
      throw new Error(`Server responded ${dataFetched}`);
    }
  } catch (err) {
    console.error(err);
    return { status: 500, error: err };
  }
}

module.exports = {
  updateStocks,
  updateCosts,
};