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
  let articleFirstLetters = article[0]+ article[1];
  // console.log("articleFirstLetters ", articleFirstLetters)
  let articleID = article;
  if(articleFirstLetters === 'RS'){
    articleID = article.replace("RS","98");
  }
  else if(articleFirstLetters === 'HQ'){
    articleID = article.replace("HQ","54");
  }
  // console.log("article ", articleID)
  try {
    var maxBonusCheck;
    await dbQuerie.maxBonusCheck(articleID, async (result) => {
      // console.log("result ", result[0].count)
      maxBonusCheck = result[0].count;
    });
    // console.log("maxBonusCheck ", maxBonusCheck);
    if (maxBonusCheck === 0) {
      // Perform some query
      return res.json({
        success: true,
        status: 200,
        data: {
          items: [
            {
              art_id: article,
              max_cashback: 0,
            },
          ],
        },
      });
    } else if(maxBonusCheck !== undefined){
      // Perform another query
      return res.json({
        success: true,
        status: 200,
        data: {
          items: [
            {
              art_id: article,
              max_cashback: 20,
            },
          ],
        },
      });
    }
    else{
      res.status(500).send({
        success: false,
        status: 500,
        data:[
          {
            message: "Unpredictable error"
          }
        ]
      });
    }
  } catch (err) {
    log.error("maxBonusCheck error: " + err);
    res.status(404).send({
      success: false,
      status: 404,
      data:[
        {
          message: err
        }
      ]
    });
  }
});

//Определение порта и хоста для сервера
app.listen(port, host, () => {
  log.info(`Server running on port ${port} and host ${host}`);
  console.log(`Server running on port ${port} and host ${host}`);
});
