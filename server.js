const express = require("express");
const app = express();
//add moment for dates
const moment = require('moment')
const getPromotions = require('./promotions1C/promotionsScheduledHandler')
//add enviroment variables
require('dotenv').config();
const port = process.env.PORT;

//add logger
const SimpleNodeLogger = require('simple-node-logger')
opts = {
  logFilePath: `logs/${moment().format('DD-MM-YYYY')}-main.log`,
  timestampFormat: 'DD-MM-YYYY HH:mm:ss.SSS'
}
const log = SimpleNodeLogger.createSimpleLogger(opts);

//check health
app.get("/ping", (req, res) => {
  res.send("pong");
});

app.use('/api', getPromotions);

app.listen(port, "0.0.0.0", () => {
  log.info(`Server running on port ${port}`)
  console.log(`Server running on port ${port}`);
});
