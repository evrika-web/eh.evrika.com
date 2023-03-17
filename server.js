const express = require("express");
const app = express();
const moment = require("moment");
const promotionsRouter = require("./api/promotionsRouter");
const port = process.env.PORT;
const host = process.env.HOST;
require("./scheduledJobs/schedule");
require("dotenv").config();

//Добавление логирования ошибок и запросов
const SimpleNodeLogger = require("simple-node-logger");
const dbQuerie = require("./database/dbQuerie");
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
    await dbQuerie.maxBonusCheck(articleID, async (result) => {
      if (result.length !== 0) {
        maxBonusCheck = result[0].count;
        if (result[0].nal !== null) maxBonusPercent = result[0].nal;
        else {
          maxBonusPercent = 20;
        }
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
//Определение порта и хоста для сервера
app.listen(port, host, () => {
  log.info(`Server running on port ${port} and host ${host}`);
  console.log(`Server running on port ${port} and host ${host}`);
});
