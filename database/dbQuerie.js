const knex = require("./knex");
const moment = require("moment");

module.exports = {
  //Отправка акции в БД
  createPromotionData: async (data, callback) => {
    await knex("promotions")
      .insert(data, "*")
      .then((update) => {
        var disablePromo = [];
        data.forEach(async (element) => {
          switch (element.type) {
            case "cascade":
              await knex("promotions")
                .whereNot("doc_number", element.doc_number)
                .andWhere("type", "cascade")
                .update({
                  type: "cascade-old",
                  active: false,
                  updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                })
                .then((updateCascade) => {
                  disablePromo.push(updateCascade);
                })
                .catch((err) => {
                  console.log(err);
                  callback(undefined);
                });
              break;
            case "coupon":
              await knex("promotions")
                .whereNot("doc_number", element.doc_number)
                .andWhere("type", "coupon")
                .update({
                  type: "coupon-old",
                  active: false,
                  updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                })
                .then((updateCoupon) => {
                  disablePromo.push(updateCoupon);
                })
                .catch((err) => {
                  console.log(err);
                  callback(undefined);
                });
              break;
            case "promocode":
              await knex("promotions")
                .whereNot("doc_number", element.doc_number)
                .andWhere("type", "promocode")
                .update({
                  type: "promocode-old",
                  active: false,
                  updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                })
                .then((updateCoupon) => {
                  disablePromo.push(updateCoupon);
                })
                .catch((err) => {
                  console.log(err);
                  callback(undefined);
                });
              break;
            default:
              break;
          }
        });
        callback(update);
      })
      .catch((err) => {
        console.log(err);
        callback(undefined);
      });
  },

  // Получение данных по активным акциям
  getActivePromotions: async (callback) => {
    await knex("promotions")
      .where({ active: 1 })
      .select("*")
      .then((response) => {
        callback(response);
      })
      .catch((err) => {
        console.log(err);
        callback(undefined);
      });
  },

  //Получение номера документа активных акций
  getActivePromotionsID: async (callback) => {
    await knex("promotions")
      .where({ active: 1 })
      .select("doc_number", "type")
      .then((response) => {
        callback(response);
      })
      .catch((err) => {
        console.log(err);
        callback(undefined);
      });
  },

  //Проверка окончания акции по дате
  checkPromotionsEnd: async (callback) => {
    await knex("promotions")
      .where("end_date", "<", moment().format("YYYY-MM-DD HH:mm:ss"))
      .andWhere("active", true)
      .orWhere("type","cascade-old")
      .orWhere("type","coupon-old")
      .update({
        active: false,
        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
      })
      .then((update) => {
        callback(update);
      })
      .catch((err) => {
        console.log(err);
        callback(undefined);
      });
  },

  //Проверка начала акции по дате
  checkPromotionStart: async (callback) => {
    await knex("promotions")
      .where("start_date", "<", moment().format("YYYY-MM-DD HH:mm:ss"))
      .where("end_date", ">", moment().format("YYYY-MM-DD HH:mm:ss"))
      .andWhere({active: false})
      .whereNot({type:"cascade-old"})
      .whereNot({type:"coupon-old"})
      .update({
        active: true,
        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
      })
      .then((update) => {
        callback(update);
      })
      .catch((err) => {
        console.log(err);
        callback(undefined);
      });
  },

  //Проверка на наличие товаров в каскадах
  productExistCascade: async (articles, callback) => {
    await knex("promotions")
      .where({ active: true, type: "cascade", participate: true })
      .whereJsonObject("products", [articles])
      .select("doc_number")
      .then((response) => {
        callback(response);
      })
      .catch((err) => {
        console.log(err);
        callback(undefined);
      });
  },

  //Получение процентов по каскаду
  percentsCascade: async (doc_number_data, callback) => {
    await knex("promotions")
      .where({doc_number: doc_number_data, type:"cascade"})
      .jsonExtract("percents", "$", "cascadePercents")
      .then((response) => {
        callback(response);
      })
      .catch((err) => {
        console.log(err);
        callback(undefined);
      });
  },

  //Проверка наличия бонуса у товара по артиклу
  maxBonusCheck: async (articleID, callback) => {
    await knex("max_bonus")
      .select("*")
      .count('article as count')
      .where({article: articleID})
      .groupBy('id')
      .then((response) => {
        callback(response);
      })
      .catch((err) => {
        console.log(err);
        callback(undefined);
      });
  },
};
