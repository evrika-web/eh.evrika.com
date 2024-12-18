const app = require("./app");
const moment = require("moment");
const port = process.env.PORT;
const host = process.env.HOST;
const dbName = process.env.MONGO_DB_NAME || "search-system";
const url = process.env.MONGO_URL || "mongodb://localhost:27017";
require("dotenv").config();
const { getAppLog } = require("./utility/appLoggers");
const serverLog = getAppLog("Express");
const mongoLog = getAppLog("MongoDB");

//Добавление логирования ошибок и запросов
const SimpleNodeLogger = require("simple-node-logger");
const { connectDb } = require("./database/mongoDb/mongoQuerie");
const connectDBmongoose = require("./config/db");

opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-main.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

// Подключение к базе данных
connectDBmongoose();

//Определение порта и хоста для сервера
app.listen(port, host, async () => {
  log.info(`Server running on port ${port} and host ${host}`);
  console.log(`Server running on port ${port} and host ${host}`);
  serverLog(`Server running on port ${port} and host ${host}`);
  const dbConnected = await connectDb(url, dbName);
  if (dbConnected) {
    mongoLog("connected", url);
    serverLog("Mongo running", url);
  } else {
    serverLog("Mongo not running", url);
    mongoLog("not connected", url);
  }
});
