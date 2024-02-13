const express = require("express");
var cors = require("cors");
const app = express();

//CORS policy
app.use(cors());
app.options('*', cors())

const moment = require("moment");
const promotionsRouter = require("./router/promotionsRouter");
const catalogMainRouter = require("./router/catalogMainRouter");
const catalogRouter = require("./router/catalogRouter");
const port = process.env.PORT;
const host = process.env.HOST;
const dbName = process.env.MONGO_DB_NAME || "search-system";
const url = process.env.MONGO_URL || "mongodb://localhost:27017";
require("./scheduledJobs/scheduleCatalog");
require("./scheduledJobs/scheduleLogFiles");
// require("./scheduledJobs/schedulePromo");
require("dotenv").config();
const { getAppLog } = require("./utility/appLoggers");
const serverLog = getAppLog("Express");
const mongoLog = getAppLog("MongoDB");

//Добавление логирования ошибок и запросов
const SimpleNodeLogger = require("simple-node-logger");
const {
  connectDb
} = require("./database/mongoDb/mongoQuerie");
opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-main.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);



//ограничение в файлах json до 50МБ
app.use(express.json({ limit: "50mb" }));

//Проверка работает ли сервер
app.get("/ping", (req, res) => {
  res.send("pong");
});

//Подключение запросов по акциям
app.use("/api", promotionsRouter);

//Проверка максимального бонуса у товара по артиклу
app.get("/max-bonus/:article", async (req, res) => {
  const { article } = req.params;
  let articleFirstLetters = article[0] + article[1];
  let articleID = article;
  if (articleFirstLetters === "RS") {
    articleID = article.replace("RS", "98");
  } else if (articleFirstLetters === "HQ") {
    articleID = article.replace("HQ", "54");
  }
  try {
    var maxBonusCheck;
    await _maxBonusCheck(articleID, async (result) => {
      if (result.length !== 0) {
        maxBonusCheck = result[0].count;
        if (result[0].nal !== null) maxBonusPercent = result[0].nal;
        else {
          maxBonusPercent = process.env.MAX_BONUS_CACHBACK || 20;
        }
      } else {
        maxBonusCheck = 0;
        maxBonusPercent = process.env.MAX_BONUS_CACHBACK_STANDART || 5;
      }
    });
  } catch (err) {
    log.error("maxBonusCheck error: " + err);
    res.status(404).send({
      success: false,
      status: 404,
      data: [
        {
          message: err,
        },
      ],
    });
  }
  return res.json({
    success: true,
    status: 200,
    data: {
      items: [
        {
          art_id: article,
          max_cashback: maxBonusPercent,
        },
      ],
    },
  });
});

//Подключение запросов для каталога
app.use(catalogMainRouter);
app.use(catalogRouter);

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
