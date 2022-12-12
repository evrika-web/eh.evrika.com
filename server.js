const express = require("express");
const app = express();
const moment = require('moment');
const promotionsRouter = require('./api/promotionsRouter');
const port = process.env.PORT;
const host = process.env.HOST;
require('./scheduledJobs/schedule');
require('dotenv').config();

const SimpleNodeLogger = require('simple-node-logger')
opts = {
  logFilePath: `logs/${moment().format('DD-MM-YYYY')}-main.log`,
  timestampFormat: 'DD-MM-YYYY HH:mm:ss.SSS'
}
const log = SimpleNodeLogger.createSimpleLogger(opts);

app.use(express.json({limit: '50mb'}));
app.get("/ping", (req, res) => {
  res.send("pong");
});
app.use('/api', promotionsRouter);

app.listen(port, host, () => {
  //log.info(`Server running on port ${port} and host ${host}`)
  console.log(`Server running on port ${port} and host ${host}`);
});
