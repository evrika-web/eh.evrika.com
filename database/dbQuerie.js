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
    checkPromotionsEnd: (callback) => {
        knex('promotions')
        .where('end_date', '<',moment().format("YYYY-MM-DD HH:mm:ss"))
        .andWhere('active', true)
        .update({active:false,updated_at: moment().format("YYYY-MM-DD HH:mm:ss") })
        .then((update) => {
            callback(update)
        })
        .catch((err) => {
            console.log(err)
            callback(undefined)
        })
    },
    checkPromotionStart: (callback) => {
        knex('promotions')
        .where('start_date', '<',moment().format("YYYY-MM-DD HH:mm:ss"))
        .where('end_date', '>',moment().format("YYYY-MM-DD HH:mm:ss"))
        .where('active', false)
        .update({active:true, updated_at: moment().format("YYYY-MM-DD HH:mm:ss")})
        .then((update) => {
            callback(update)
        })
        .catch((err) => {
            console.log(err)
            callback(undefined)
        })
    },
}