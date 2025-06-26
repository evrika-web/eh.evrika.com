const moment = require("moment");
const { dataFetching } = require("../../utility/dataFetching");
const { default: axios } = require("axios");
const fs = require("fs");
const path = require("path");

const configURL = {
  headers: {
    "Api-Key": process.env.OZON_API_KEY || "",
    "Client-Id": process.env.OZON_API_CLIENT_ID || "",
  },
  method: "POST",
};
const ozonURL = process.env.OZON_API_URL || "https://api-seller.ozon.ru";

//add logger
const SimpleNodeLogger = require("simple-node-logger");
const opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-schedule-ozon-api.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

async function getAllProduct() {
  configURL.data = {
    filter: {},
    last_id: "",
    limit: 1000,
  };
  try {
    let allProducts = [];
    let hasMore = true;
    configURL.data.last_id = "";

    while (hasMore) {
      const products = await axios(ozonURL + "/v3/product/list", configURL);
      const items = products.data.result.items;
      allProducts = allProducts.concat(items);

      if (items.length < 1000) {
        hasMore = false;
      } else {
        configURL.data.last_id = products.data.result.last_id;
      }
    }

    return allProducts;
  } catch (error) {
    console.error("Error fetching products from Ozon API:", error.message);
    throw error;
  }
}

async function getAllProductsInfo({ offer_id }) {
  const chunkSize = 1000;
  const chunks = [];
  for (let i = 0; i < offer_id.length; i += chunkSize) {
    chunks.push(offer_id.slice(i, i + chunkSize));
  }

  const allProductsInfo = [];
  for (const chunk of chunks) {
    configURL.data = { offer_id: chunk };
    const products = await axios(ozonURL + "/v3/product/info/list", configURL);
    allProductsInfo.push(...products.data.items);
  }

  return allProductsInfo;
}

async function updateCostsProduct({ data }) {
  try {
    const chunkSize = 99;
    const prices = data.prices;
    let responses = [];

    for (let i = 0; i < prices.length; i += chunkSize) {
      const chunk = prices.slice(i, i + chunkSize);
      const chunkData = { prices: chunk };

      const response = await axios.post(
        ozonURL + "/v1/product/import/prices",
        chunkData,
        configURL
      );

      // Check for update errors in response
      if (response.data && Array.isArray(response.data.result)) {
        response.data.result.forEach((item) => {
          if (item.updated === false && Array.isArray(item.errors)) {
            item.errors.forEach((err) => {
              log.error(
                "In updating costs ",
                item.offer_id,
                " - ",
                err.message
              );
            });
          }
        });
      }

      responses.push(response.data);
    }

    // Save all responses to a single file after the loop
    const now = moment();
    const dateFolder = now.format("DD-MM-YYYY");
    const timeStamp = now.format("HH-mm-ss-SSS");
    const logDir = path.join("logs", "ozon", dateFolder, "costs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const filePath = path.join(logDir, `costs-${timeStamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(responses, null, 2));

    return responses;
  } catch (error) {
    console.error(
      "Error fetching update costs of products from Ozon API:",
      error.message
    );
    throw error;
  }
}

async function updateStocksProduct({ data }) {
  try {
    const chunkSize = 99;
    const stocks = data.stocks;
    let responses = [];

    for (let i = 0; i < stocks.length; i += chunkSize) {
      const chunk = stocks.slice(i, i + chunkSize);
      const chunkData = { stocks: chunk };

      const response = await axios.post(
        ozonURL + "/v2/products/stocks",
        chunkData,
        configURL
      );

      // Check for update errors in response
      if (response.data && Array.isArray(response.data.result)) {
        response.data.result.forEach((item) => {
          if (item.updated === false && Array.isArray(item.errors)) {
            item.errors.forEach((err) => {
              log.error(
                "In updating stock ",
                item.offer_id,
                " - ",
                err.message
              );
            });
          }
        });
      }

      responses.push(response.data);
    }

    // Save all responses to a single file after the loop
    const now = moment();
    const dateFolder = now.format("DD-MM-YYYY");
    const timeStamp = now.format("HH-mm-ss-SSS");
    const logDir = path.join("logs", "ozon", dateFolder, "stocks");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const filePath = path.join(logDir, `stocks-${timeStamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(responses, null, 2));

    return responses;
  } catch (error) {
    console.error(
      "Error fetching update stocks of products from Ozon API:",
      error.message
    );
    throw error;
  }
}

async function fetchWebsiteProductsData({ productArticles, branchGuids }) {
  try {
    const response = await dataFetching("/exchange/ozon/products-data", false, {
      method: "POST",
      data: {
        productArticles,
        branchGuids,
        limit: 100,
      },
    });
    // Если dataFetching возвращает { status, data }, то:
    return response.data || [];
  } catch (error) {
    console.error(
      "Error fetching products data from website API:",
      error.message
    );
    return [];
  }
}

/**
 * Формирует объект цены для Ozon
 */
function buildOzonPrice(item, siteProduct) {
  const price = siteProduct?.price ?? 0;
  const oldPrice = siteProduct?.old_price ?? 0;
  let calcOldPrice = "0";
  if (siteProduct) {
    if (
      price &&
      oldPrice &&
      oldPrice > price &&
      (
        (price < 49000 && Math.abs(price - oldPrice) / price > 0.05) ||
        (price >= 49000 && Math.abs(price - oldPrice) > 3000)
      )
    ) {
      calcOldPrice = oldPrice.toString();
    }
  }
  return {
    auto_action_enabled: "DISABLED",
    currency_code: "KZT",
    offer_id: item.offer_id,
    price: price.toString(),
    old_price: calcOldPrice,
    price_strategy_enabled: "DISABLED",
    product_id: item.product_id,
    quant_size: 1,
    vat: "0",
  };
}

/**
 * Формирует объект stock для Ozon
 */
function buildOzonStock(product, stockObj, warehouse_id) {
  const minimumStock = process.env.OZON_MINIMUM_STOCK || 2;
  const maximumStock = process.env.OZON_MAXIMUM_STOCK || 50;
  let stock = 0;
  if (stockObj) {
    if (stockObj.stock <= minimumStock) stock = 0;
    else if (stockObj.stock >= maximumStock) stock = 50;
    else stock = stockObj.stock;
  }
  return {
    offer_id: product.offer_id,
    product_id: product.product_id,
    quant_size: 1,
    stock,
    warehouse_id,
  };
}

async function updateStockCostOzon() {
  // Конфигурация городов
  const cityConfigs = [
    {
      name: "Алматы РЦ",
      branchGuid: "4318444d-c0be-11e1-9c78-001e670c9281",
      warehouse_id: (product) =>
        product.is_kgt ? 1020005000166135 : 1020005000165063,
      useKgt: true,
    },
    {
      name: "Шымкент РЦ",
      branchGuid: "5a585097-50d0-11e1-beb2-0027133dad0a",
      warehouse_id: () => 1020005000192914,
      useKgt: false,
    },
    // Добавляйте новые города по аналогии
  ];

  try {
    const allProducts = await getAllProduct();
    const offerIds = allProducts.map((product) => product.offer_id);
    const allProductsInfo = await getAllProductsInfo({ offer_id: offerIds });

    // Объединяем данные о продуктах
    const mergedProducts = allProducts.map((product) => ({
      ...product,
      ...(allProductsInfo.find((info) => info.offer_id === product.offer_id) ||
        {}),
    }));

    const branchGuids = cityConfigs.map((c) => c.branchGuid);
    const chunkSize = 100;
    const ozonStockData = [];
    const ozonPriceData = [];
    const websiteProductsData = [];

    for (let i = 0; i < mergedProducts.length; i += chunkSize) {
      const chunk = mergedProducts.slice(i, i + chunkSize);
      const productArticles = chunk.map((p) => p.offer_id);

      // Получаем данные с сайта пачкой
      const data = await fetchWebsiteProductsData({
        productArticles,
        branchGuids,
      });
      websiteProductsData.push(...data);

      // STOCKS
      cityConfigs.forEach((city) => {
        const productsForCity = city.useKgt
          ? chunk
          : chunk.filter((product) => !product.is_kgt);

        productsForCity.forEach((product) => {
          const siteProduct = data.find(
            (d) => d.vendor_code === product.offer_id
          );
          const stockObj = siteProduct?.stocks?.find(
            (s) => s.branch_guid === city.branchGuid
          );
          ozonStockData.push(
            buildOzonStock(product, stockObj, city.warehouse_id(product))
          );
        });
      });

      // PRICES (только по данным сайта, не по городам)
      chunk.forEach((item) => {
        const siteProduct = data.find((d) => d.vendor_code === item.offer_id);
        ozonPriceData.push(buildOzonPrice(item, siteProduct));
      });
    }

    let responseCosts = null;
    let responseStocks = null;
    try {
      responseCosts = await updateCostsProduct({
        data: { prices: ozonPriceData },
      });
    } catch (error) {
      console.error("Error updating costs:", error.message);
    }
    try {
      responseStocks = await updateStocksProduct({
        data: { stocks: ozonStockData },
      });
    } catch (error) {
      console.error("Error updating stocks:", error.message);
    }
    return {
      status: 200,
      responseCosts,
      responseStocks,
    };
  } catch (error) {
    console.error("Error in updateStockCostOzon:", error.message);
    return {
      status: 500,
      error: error.message,
    };
  }
}

async function deactivateOzonSaleProducts() {
  try {    
    configURL.method = "GET";
    const response = await axios.get(
      ozonURL + "/v1/actions",
      configURL
    );
    
    return response.data.result;
  } catch (error) {
    console.error("Error deactivating Ozon sale products:", error.message);
    return {
      status: 500,
      error: error.message,
    };
  }
}
module.exports = {
  getAllProduct,
  updateCostsProduct,
  updateStocksProduct,
  updateStockCostOzon,
  deactivateOzonSaleProducts,
};
