const knex = require('./knex')
const moment = require('moment')

module.exports = {
    createPromotionData: async (data, callback) => {
        await knex('promotions')
        .insert(data, "*")
        .then( (update) => {
            callback(update)
        })
        .catch((err) => {
            console.log(err)
            callback(undefined)
        })
    },
    getActivePromotions:async (callback) => {
        await knex('promotions')
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
    getActivePromotionsID: async (callback) => {
         await knex('promotions')
        .where({active:1})
        .select('doc_number')
        .then( (response) => {
            callback(response)
        })
        .catch((err) => {
            console.log(err)
            callback(undefined)
        })
    },
    checkPromotionsEnd: async (callback) => {
        await knex('promotions')
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
    checkPromotionStart: async (callback) => {
        await knex('promotions')
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
    productExistCascade: async (article, callback) => {
        await knex('promotions')
        .where('active',true)
        .andWhere('type','cascade')
        // .whereLike('products', '%'+article+'%')
        .whereJsonObject('products',  [article] )
        // .whereJsonPath('products', '$', '=', [article])
        .select('doc_number')
        .then( (response) => {
            callback(response)
        })
        .catch((err) => {
            console.log(err)
            callback(undefined)
        })
    },
}