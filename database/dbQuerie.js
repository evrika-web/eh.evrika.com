const knex = require('./knex')
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
        .then((update) => {
            callback(update)
        })
        .catch((err) => {
            console.log(err)
            callback(undefined)
        })
    },
}