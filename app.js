const express = require("express");
var cors = require("cors");
const app = express();

//CORS policy
app.use(cors());
app.options('*', cors())

const moment = require("moment");
const promotionsRouter = require("./routes/promotionsRouter");
const mainRouter = require("./routes/mainRouter");
const catalogRouter = require("./routes/catalogRouter");
const halykMarketRouter = require("./routes/halykMarketRouter");
const kaspiMarketRouter = require("./routes/kaspiMarketRouter");
const fileSystemBinaryRouter = require("./routes/fileSystemBinaryRouter");
const fileSystemFSRouter = require("./routes/fileSystemFSRouter");
require("./scheduledJobs/scheduleCatalog");
require("./scheduledJobs/scheduleLogFiles");
// require("./scheduledJobs/schedulePromo");
require("dotenv").config();
const { getAppLog } = require("./utility/appLoggers");
const jwt = require('jsonwebtoken');

//Добавление логирования ошибок и запросов
const SimpleNodeLogger = require("simple-node-logger");
const dbQuerie = require("./database/mySQL/dbQuerie");
const errorHandler = require("./middleware/errorHandler");
const { getStockWithDetails } = require("./controllers/stockController");
const { getProductWithStocks } = require("./controllers/productController");
opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-main.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

//ограничение в файлах json до 100МБ
app.use(express.json({ limit: "100mb" }));

// const { useTreblle } = require('treblle')

// useTreblle(app, {
//   apiKey: 'zCaKkCqQbAYOsj7in1jSMT8Z05zKq1Bb',
//   projectId: 'j0hX8iV7TRyWBEuy',
// })

//Проверка работает ли сервер
app.get("/ping", (req, res) => {
  res.send("pong");
});

// Маршрут для аутентификации и получения токена
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Здесь должна быть проверка по базе данных или другому источнику данных
  if (username === process.env.AUTH_LOGIN | 'admin' && password === process.env.AUTH_PASSWORD | 'x1z-uuyoT$lul2N*') {
    const user = { username };
    const accessToken = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ accessToken });
  } else {
    res.status(401).json({ message: 'Неправильное имя пользователя или пароль' });
  }
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
//тестовое задание для тестировщика
app.get("/max-bonus-test/:article", async (req, res) => {
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
    await dbQuerie.maxBonusCheck(articleID, async (result) => {
      if (result.length !== 0) {
        maxBonusCheck = result[0].count;
        if (articleID === "98400015709") {
          maxBonusPercent = 1.5;
        } else if (articleID === "98400015708") {
          maxBonusPercent = true;
        }
         else if (result[0].nal !== null) {
          maxBonusPercent = result[0].nal;
        } else if (articleID === "OF000009597") {
          maxBonusPercent = 5;
        } else {
          maxBonusPercent = 20;
        }
      } else if (articleID === "test") {
        maxBonusPercent = "Why you are so serious?";
      } else {
        maxBonusCheck = 0;
        maxBonusPercent = process.env.MAX_BONUS_CACHBACK || 5;
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
  if(articleID === '98400015864'){
    return res.json({
      success: true,
      status: 404,
      err:'404 Not Found!'
    });
  } else if(articleID === 'OF000009590'){
    return res.json({
      success: true,
      status: 500,
      err:'unpredictable error'
    });
  } else if(articleID === 'OF000009589'){
    return res.json({
      success: true,
      status: 200,
      data: {
        items: [
          {
            art_Id: article,
            max_CashBack: maxBonusPercent,
          },
        ],
      },
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
app.use(mainRouter);
app.use(catalogRouter);

//Подключение запросов по halyk market
app.use("/halyk", halykMarketRouter);

//Подключение запросов по kaspi market
app.use("/kaspi", kaspiMarketRouter);

//Подключение запросов по файловой системе Mongo Binary
app.use("/files-binary", fileSystemBinaryRouter);

// Middleware для обработки данных формы
app.use(express.urlencoded({ extended: true }));

//Подключение запросов по файловой системе FS
app.use("/files", fileSystemFSRouter);

// Маршрут для получения данных о наличии на складе вместе с продуктами и филиалами
app.get('/get-stocks', getStockWithDetails);

// Маршрут для получения товара и его стоков по _id
app.get('/products/:id/:slug', getProductWithStocks);

// Error handling
app.use(errorHandler);

module.exports = app;