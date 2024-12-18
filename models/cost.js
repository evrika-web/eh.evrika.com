const mongoose = require("mongoose");

const costSchema = new mongoose.Schema(
  {
    _id: String,
    product: String, // Можно указывать только нужные поля
    product_code: String,
    product_type: String,
    costs: [
      {
        type: String,
        type_guid: String,
        primary: Boolean,
        cost: Number,
      },
    ],
  },
  { strict: false }
); // strict: false позволяет добавлять в базу любые поля, даже если они не указаны в схеме

// Виртуальное поле для связи по branch_guid
costSchema.virtual("productKey", {
  ref: "Product", // Имя модели
  localField: "product_code", // Поле в cost
  foreignField: "vendorCode", // Поле в Branch для связи
  justOne: true, // Указывает, что ожидается только один документ
});

// Добавление виртуальных полей в JSON-вывод
costSchema.set("toObject", { virtuals: true });
costSchema.set("toJSON", { virtuals: true });

const Cost = mongoose.model("Cost", costSchema, "costs");

module.exports = Cost;
