const express = require("express");
const app = express();

//add moment for dates
const moment = require('moment')

//add functions
const getPromotions = require('./promotions1C/promotions')

//add schedule
require('./scheduledJobs/schedule');

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

//extend json file limit to 50mb
app.use(express.json({limit: '50mb'}));

//check health
app.get("/ping", (req, res) => {
  res.send("pong");
});

//add router for services
app.use('/api', getPromotions.router);

//main server listner
app.listen(port, "0.0.0.0", () => {
  log.info(`Server running on port ${port}`)
  console.log(`Server running on port ${port}`);
});
