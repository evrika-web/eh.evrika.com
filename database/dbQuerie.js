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
    productExistCascade: async (articles, callback) => {
        await knex('promotions')
        .where({active: true, type:'cascade' })
        .whereJsonObject('products',  [articles] )
        .select('doc_number')
        .then( (response) => {
            callback(response)
        })
        .catch((err) => {
            console.log(err)
            callback(undefined)
        })
    },
    // productExistCascade2: async (articles, callback) => {
    //         let products = []            
    //         for(var i in articles){
    //             await knex('promotions')
    //             .where({active:true, type:'cascade'})
    //             .whereJsonObject('products',  [articles[i]] )
    //             .select('promotion_id')
    //             .then( (response) => {
    //                 console.log("response ", response)
    //                 if(Array.isArray(response) && response.length!=0)
    //                 {products.push(articles[i])}
    //                 console.log("products ", products)
    //             })from string
    //             .catch((err) => {
    //                 console.log(err)
    //             })                
    //         }
    //         console.log("callback(products) ", products)
    //         callback(products)
    //     },
    percentsCascade: async (doc_number, callback) => {
        await knex('promotions')
        .where('doc_number', doc_number)
        .jsonExtract('percents','$','cascadePercents')
        .then( (response) => {
            callback(response)
        })
        .catch((err) => {
            console.log(err)
            callback(undefined)
        })
    },
}