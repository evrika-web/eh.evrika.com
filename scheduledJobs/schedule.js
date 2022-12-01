const schedule = require('node-schedule')
const moment = require('moment')

//add functions
const promotions = require('../api/promotionsRouter')
const dbQuerie = require('../database/dbQuerie')

//add logger
const SimpleNodeLogger = require('simple-node-logger')
opts = {
  logFilePath: `logs/${moment().format('DD-MM-YYYY')}-schedule.log`,
  timestampFormat: 'DD-MM-YYYY HH:mm:ss.SSS'
}
const log = SimpleNodeLogger.createSimpleLogger(opts);

//schedules 
// schedule.scheduleJob({hour: 19, minute: 08}, async () => {
//     log.info(moment().format('HH:mm DD-MM-YYYY'), 'Time to check Promotions From 1C')
//      try{
//        var result = await promotions.getPromotionsfrom1C(); 
//        var updateDB = await promotions.setPromotion(result);
//        log.info(updateDB);
//      }catch (err) {
//        log.info(err);
//        console.log(err);
//      }
//    });
   
   schedule.scheduleJob({hour: 20, minute: 17}, async () => {
     log.info(moment().format('HH:mm DD-MM-YYYY'), ' Time to check end date of promotions')
      try{
        dbQuerie.checkPromotionsEnd((updatedPromotions) => {
          log.info("GET result /check-promotions-activity for promotions end", updatedPromotions);
          return updatedPromotions;
        });
        dbQuerie.checkPromotionStart((updatedPromotions) => {
          log.info("GET result /check-promotions-activity for promotions start", updatedPromotions);
          return updatedPromotions;
        });
       //  log.info(result);
       console.log('Schedule check end date: ', result);
      }catch (err) {
        log.info('Schedule check end date error: ', err);
        console.log(err);
      }
    });