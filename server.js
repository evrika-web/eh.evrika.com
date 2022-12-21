const express = require("express");
const app = express();
const moment = require('moment');
const promotionsRouter = require('./api/promotionsRouter');
const port = process.env.PORT;
const host = process.env.HOST;
require('./scheduledJobs/schedule');
require('dotenv').config();

//Добавление логирования ошибок и запросов
const SimpleNodeLogger = require('simple-node-logger')
opts = {
  logFilePath: `logs/${moment().format('DD-MM-YYYY')}-main.log`,
  timestampFormat: 'DD-MM-YYYY HH:mm:ss.SSS'
}
const log = SimpleNodeLogger.createSimpleLogger(opts);

//ограничение в файлах json до 50МБ
app.use(express.json({limit: '50mb'}));

//Проверка работает ли сервер
app.get("/ping", (req, res) => {
  res.send("pong");
});

//Подключение запросов по акциям
app.use('/api', promotionsRouter);

//Определение порта и хоста для сервера
app.listen(port, host, () => {
  log.info(`Server running on port ${port} and host ${host}`)
  console.log(`Server running on port ${port} and host ${host}`);
});
