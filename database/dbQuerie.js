const knex = require('./knex')
const moment = require('moment')

module.exports = {
    createPromotionData: (data, callback) => {
        knex('promotions')
        .insert(data, "*")
        .then((update) => {
            callback(update)
        })
        .catch((err) => {
            console.log(err)
            callback(undefined)
        })
    },
    getActivePromotions: (callback) => {
        knex('promotions')
        .where({active:1})
        .select('*')
        .then((response) => {
            callback(response)
        })
        .catch((err) => {
            console.log(err)
            callback(undefined)
        })
    },
    getActivePromotionsID: (callback) => {
        knex('promotions')
        .where({active:1})
        .select('doc_number')
        .then((response) => {
            callback(response)
        })
        .catch((err) => {
            console.log(err)
            callback(undefined)
        })
    },
    checkPromotionActivity: (callback) => {
        knex('promotions')
        .where('end_date', '<',moment().format("YYYY-MM-DDTHH:mm:ss"))
        .update({active:false},['promotion_id','active'])
        .then((update) => {
            callback(update)
        })
        .catch((err) => {
            console.log(err)
            callback(undefined)
        })
    },
}