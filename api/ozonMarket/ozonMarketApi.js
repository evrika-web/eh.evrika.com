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

async function getDataFromWebsite({ vendorCode, city, branchGuid }) {
  const maxRetries = 5;
  let attempt = 0;
  let delay = 1500; // Start with 1 second

  while (attempt < maxRetries) {
    try {
      const response = await dataFetching(
        `/products/available/city/${city}/vendorcode/${vendorCode}`,
        false
      );
      if (response.status === 200) {
        var stock = response.data.branches
          .filter((branch) => branch.guid === branchGuid)
          .reduce(
            (acc, branch) =>
              acc + ((branch.quality && branch.quality["Новый"]) || 0),
            0
          );

        const data = {
          stock: stock,
          price: response.data.cost,
          oldPrice: response.data.old_cost,
        };
        return data;
      } else if (response.status === 429) {
        attempt++;
        console.warn(
          `Attempt ${attempt} - Received 429 Too Many Requests. Retrying after ${delay}ms...`
        );
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw new Error("Failed to fetch data from website");
      }
    } catch (error) {
      if (error.response && error.response.status === 429) {
        attempt++;
        console.warn(
          `Attempt ${attempt} - Received 429 Too Many Requests. Retrying after ${delay}ms...`
        );
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2; // Exponential backoff
      } else if (error.response && error.response.status === 404) {
        console.error(
          `Error 404 - Resource not found for vendorCode: ${vendorCode}, city: ${city}, branchGuid: ${branchGuid}`
        );
        throw new Error("Resource not found (404)");
      } else {
        attempt++;
        console.error(
          `Attempt ${attempt} - Error fetching data from website:`,
          error.message
        );
        if (attempt >= maxRetries) {
          throw error;
        }
      }
    }
  }
  throw new Error("Max retries reached for getDataFromWebsite");
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

async function updateStockCostOzon() {
  const pLimit = (await import("p-limit")).default;

  // Конфигурация городов: branchGuid, warehouse_id, условие для is_kgt (если нужно)
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
    const mergedProducts = allProducts.map((product) => {
      const productInfo = allProductsInfo.find(
        (info) => info.offer_id === product.offer_id
      );
      return { ...product, ...productInfo };
    });

    // Получаем список branchGuid для запроса
    const branchGuids = cityConfigs.map((c) => c.branchGuid);

    // Разбиваем товары на чанки по 100
    const chunkSize = 100;
    let ozonStockData = [];
    let ozonPriceData = [];
    let websiteProductsData = [];

    for (let i = 0; i < mergedProducts.length; i += chunkSize) {
      const chunk = mergedProducts.slice(i, i + chunkSize);
      const productArticles = chunk.map((p) => p.offer_id);

      // Получаем данные с сайта пачкой
      const data = await fetchWebsiteProductsData({
        productArticles,
        branchGuids,
      });
      websiteProductsData.push(...data);

      // Для каждого branchGuid и каждого товара формируем ozonStockData
      for (const city of cityConfigs) {
        // Фильтруем продукты, если не нужно учитывать is_kgt
        const productsForCity = city.useKgt
          ? chunk
          : chunk.filter((product) => !product.is_kgt);

        for (const product of productsForCity) {
          const siteProduct = data.find(
            (d) => d.vendor_code === product.offer_id
          );
          const stockObj = siteProduct?.stocks?.find(
            (s) => s.branch_guid === city.branchGuid
          );
            ozonStockData.push({
            offer_id: product.offer_id,
            product_id: product.product_id,
            quant_size: 1,
            stock:
              stockObj && stockObj.stock <= 2
              ? 0
              : stockObj && stockObj.stock >= 50
              ? 50
              : stockObj
              ? stockObj.stock
              : 0,
            warehouse_id: city.warehouse_id(product),
            });
        }
      }
      ozonPriceData.push(
        ...chunk.map((item) => {
          const siteProduct = data.find((d) => d.vendor_code === item.offer_id);
          return {
            auto_action_enabled: "DISABLED",
            currency_code: "KZT",
            offer_id: item.offer_id,
            price: siteProduct ? siteProduct.price?.toString() || "0" : "0",
            old_price: siteProduct
              ? siteProduct.price &&
                siteProduct.old_price &&
                siteProduct.old_price <= siteProduct.price
                ? "0"
                : (siteProduct.price < 49000 &&
                    Math.abs(siteProduct.price - siteProduct.old_price) /
                      siteProduct.price >
                      0.05) ||
                  (siteProduct.price >= 49000 &&
                    Math.abs(siteProduct.price - siteProduct.old_price) > 3000)
                ? siteProduct.old_price?.toString() || "0"
                : "0"
              : "0",
            price_strategy_enabled: "DISABLED",
            product_id: item.product_id,
            quant_size: 1,
            vat: "0",
          };
        })
      );
    }

    // Формируем ozonPriceData только по первому branchGuid (или адаптируйте под ваши задачи)
    // const ozonPriceData = mergedProducts.map((item) => {
    //   const siteProduct = data.find((d) => d.vendor_code === item.offer_id);
    //   return {
    //     auto_action_enabled: "DISABLED",
    //     currency_code: "KZT",
    //     offer_id: item.offer_id,
    //     price: siteProduct ? siteProduct.price?.toString() || "0" : "0",
    //     old_price: siteProduct
    //       ? siteProduct.price &&
    //         siteProduct.old_price &&
    //         siteProduct.old_price <= siteProduct.price
    //         ? "0"
    //         : (siteProduct.price < 49000 &&
    //             Math.abs(siteProduct.price - siteProduct.old_price) /
    //               siteProduct.price >
    //               0.05) ||
    //           (siteProduct.price >= 49000 &&
    //             Math.abs(siteProduct.price - siteProduct.old_price) > 3000)
    //         ? siteProduct.old_price?.toString() || "0"
    //         : "0"
    //       : "0",
    //     price_strategy_enabled: "DISABLED",
    //     product_id: item.product_id,
    //     quant_size: 1,
    //     vat: "0",
    //   };
    // });
    // console.log("ozonPriceData length:", ozonPriceData);
    // return {
    //   status: 200,
    //   responseCosts: ozonPriceData,
    //   responseStocks: ozonStockData,
    // };
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
      responseCosts: responseCosts,
      responseStocks: responseStocks,
    };
  } catch (error) {
    console.error("Error in updateStockCostOzon:", error.message);
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
};
