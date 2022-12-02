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
schedule.scheduleJob({hour: 19, minute: 08}, async () => {
    log.info(moment().format('HH:mm DD-MM-YYYY'), 'Time to check new Promotions From 1C')
     try{
      var promo1C = await promotionsFunctions.getPromotionsfrom1C();
      var postPromo = await promotionsFunctions.setPromotion(promo1C);
       log.info(postPromo);
     }catch (err) {
       log.info(err);
       console.log(err);
     }
   });
   
   schedule.scheduleJob({hour: 10, minute: 57}, async () => {
     log.info(moment().format('HH:mm DD-MM-YYYY'), ' Time to check end date of promotions')
      try{
        dbQuerie.checkPromotionsEnd((updatedPromotions) => {
          log.info(
            "checkPromotionsActivity end date ",
            updatedPromotions
          );
        });
        dbQuerie.checkPromotionStart((updatedPromotions) => {
          log.info(
            "checkPromotionsActivity start date ",
            updatedPromotions
          );
        });
       log.info('Schedule check All promotions is up to date');
      }catch (err) {
        log.info('Schedule check end,start date error: ', err);
        console.log(err);
      }
    });