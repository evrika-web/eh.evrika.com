const express = require('express');
const app = express();
const router = express.Router();
const axios = require('axios')
const moment = require('moment')
require('dotenv').config();
const SimpleNodeLogger = require('simple-node-logger')
opts = {
    logFilePath: `logs/${moment().format('DD-MM-YYYY')}-client.log`,
    timestampFormat: 'DD-MM-YYYY HH:mm:ss.SSS'
}
const log = SimpleNodeLogger.createSimpleLogger(opts);

router.get('/promotions', (req, res) => {
    console.log('Request for promotions JSON')
    log.info('Request for promotions JSON')
    res.json(getPromotions())
})

const url1CPromotions = process.env.URL_1C_PROMOTIONS; 
let data1CPromotions ={
    "Акции" : "",
    "MainDivisionCode" : "000000017"
}
let config1CPromotions ={
    headers: {
        auth: {
            username: process.env.USER_1C_PROMOTIONS,
            password: process.env.PASSWORD_1C_PROMOTIONS
          }
      }
}

function getPromotions(){
    axios.post(url1CPromotions,data1CPromotions,config1CPromotions )
  .then(function (response) {    
    console.log(response.data.Акции);
    return response.data;
  })
  .catch(function (error) {
    console.log(error);
    return error;
  });
}
module.exports = router;