const schedule = require('node-schedule')
const moment = require('moment')

//add functions
const getPromotions = require('../api/promotions')
const checkDatePromotion = require('../database/dbQuerie')

//add logger
const SimpleNodeLogger = require('simple-node-logger')
opts = {
  logFilePath: `logs/${moment().format('DD-MM-YYYY')}-schedule.log`,
  timestampFormat: 'DD-MM-YYYY HH:mm:ss.SSS'
}
const log = SimpleNodeLogger.createSimpleLogger(opts);

//schedules 
schedule.scheduleJob({hour: 03, minute: 02}, async () => {
    log.info(moment().format('HH:mm DD-MM-YYYY'), 'Time to check Promotions From 1C')
     try{
       var result = await getPromotions.getPromotionsfrom1C(); 
       var updateDB = await getPromotions.setPromotion(result);
       log.info(updateDB);
     }catch (err) {
       log.info(err);
       console.log(err);
     }
   });
   
   schedule.scheduleJob({hour: 18, minute: 26}, async () => {
     log.info(moment().format('HH:mm DD-MM-YYYY'), ' Time to check end date of promotions')
      try{
        var result = await checkDatePromotion.checkDatePromo(); 
       //  log.info(result);
       console.log('Schedule check end date: ', result);
      }catch (err) {
        log.info('Schedule check end date error: ', err);
        console.log(err);
      }
    });