const knex = require("./knex");
const moment = require("moment");

module.exports = {
  //Отправка акции в БД
  createPromotionData: async (data, callback) => {
    await knex("promotions")
      .insert(data, "*")
      .then((update) => {
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
      .select("doc_number","type")
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
      .where("active", false)
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
  percentsCascade: async (doc_number, callback) => {
    await knex("promotions")
      .where("doc_number", doc_number)
      .jsonExtract("percents", "$", "cascadePercents")
      .then((response) => {
        callback(response);
      })
      .catch((err) => {
        console.log(err);
        callback(undefined);
      });
  },

  //Снятие с активного значения акции
//   checkPromotionsEnd: async (callback) => {
//     await knex("promotions")
//       .where("end_date", "<", moment().format("YYYY-MM-DD HH:mm:ss"))
//       .andWhere("active", true)
//       .update({
//         active: false,
//         updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
//       })
//       .then((update) => {
//         callback(update);
//       })
//       .catch((err) => {
//         console.log(err);
//         callback(undefined);
//       });
//   },
};
