// controllers/productController.js
const Product = require("../models/product");
const Stock = require("../models/stock");
const Branch = require("../models/branch");
const Cost = require("../models/cost");
const productMapping = require("../services/productService");
const moment = require("moment");

async function getProductWithStocks(req, res) {
  try {
    const { id, slug } = req.params;
    const productId = parseInt(id); // Конвертируем параметр запроса в число
    console.log("🚀 ~ getProductWithStocks ~ productId:", productId);
    const productSlug = slug;
    console.log("🚀 ~ getProductWithStocks ~ productSlug:", productSlug);
    const cityId = parseInt(req.query.city_id);
    console.log("🚀 ~ getProductWithStocks ~ cityId:", cityId);

    // if (isNaN(productId) || isNaN(cityId)) {
    //   return res
    //     .status(400)
    //     .json({ error: "Invalid product ID or city ID format" });
    // }

    // Находим товар по его _id
    let product = await Product.findOne({
      _id: productId,
      slug: productSlug,
      published: true,
    }).lean();
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    delete product.locations;

    // Находим все записи цен, связанные с данным товаром
    const costsData = await Cost.findById(product.vendor_code).lean().exec();

    //Присваиваем значения цен из 1С
    product.cost = 0;
    product.old_cost = 0;

    if (
      costsData &&
      Array.isArray(costsData.costs) &&
      costsData.costs.length > 0
    ) {
      product.cost =
        costsData.costs.find((item) => item.type === "Интернет-Магазин").cost ||
        0;
      product.old_cost =
        costsData.costs.find((item) => item.type === "РРЦ").cost || 0;
    } else {
      return res.status(404).json({ error: "Not found costs" });
    }

    //Проверяем чтобы цены были проставлены в 1С и не 0
    if (product.cost === 0 || product.old_cost === 0) {
      Product.updateOne({ _id: productId }, { published: false });
      return res.status(404).json({ error: "costs is 0" });
    }

    // Находим все записи стоков, связанные с данным товаром
    const stocks = await Stock.find({ product_guid: product.guid })
      .populate({
        path: "branchKey",
        match: { city_id: cityId },
      })
      .lean()
      .exec();

    // Оставляем только те стоки, у которых филиалы соответствуют cityId
    const filteredStocks = stocks.filter((stock) => stock.branchKey);

    //Проверка на доступность товара для покупки
    if (Array.isArray(filteredStocks) && filteredStocks.length > 0) {
      product.quality = filteredStocks.flatMap((item) => item.quality);
      product.availableForPurchase = true;
      //ToDo: добавить проверку есть ли возможность доставки с другого города
      product.availableForPurchaseFromDc = false;
    } else {
      product.availableForPurchase = false;
      //ToDo: добавить проверку есть ли возможность доставки с другого города
      product.availableForPurchaseFromDc = false;
    }

    // ToDo: добавить из бэка получение коэффициентов
    product.bank_coefficient = 12;
    product.bank_coefficient_month = "0,0833333333";
    product.bonus = null;

    //ToDo: добавить проверку аксессуаров
    product.hasAccessories = false;

    product.category = product.category?.guid || "";
    delete product.filter_specifications;

    if (Array.isArray(product.images) && product.images.length > 0) {
      let tempImages = [];
      product.images.map((e) =>
        tempImages.push(
          `${process.env.CDN_URL}/storage/products/images/big/${e.image}`
        )
      );
      product.images = tempImages;
    } else {
      product.images = [];
    }
    product.brand.image = `${process.env.CDN_URL}/storage/brands/small/${product.brand.image}`;
    product.model = product.model_id;

    //ToDo: брать данные в зависимости от доставки из другого города
    if (product.availableForPurchase) {
      product.pickUpDate = `${moment().format("DD-MM-YYYY")}`;
    } else {
      product.pickUpDate = null;
    }

    product.specifications = product.primary_spec_values;
    delete product.primary_spec_values;

    // Формируем ответ с данными о товаре и связанных стоках
    return res.status(200).json({ data: product });
  } catch (error) {
    console.error("Error fetching product with stocks:", error);
    return res
      .status(500)
      .json({ error: "Error fetching product with stocks" });
  }
}

module.exports = { getProductWithStocks };
