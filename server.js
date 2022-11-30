const express = require("express");
const app = express();
const moment = require('moment');
const promotions = require('./api/promotions');
const port = process.env.PORT;
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
app.use('/api', promotions);

app.listen(port, "0.0.0.0", () => {
  //log.info(`Server running on port ${port}`)
  //console.log(`Server running on port ${port}`);
});
