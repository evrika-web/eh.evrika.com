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

async function getDataFromWebsite({ vendorCode }) {
  const maxRetries = 5;
  let attempt = 0;
  let delay = 1000; // Start with 1 second

  while (attempt < maxRetries) {
    try {
      const response = await dataFetching(
        `/products/available/city/1/vendorcode/${vendorCode}`,
        false
      );
      if (response.status === 200) {
        var stock = response.data.branches
          .filter(
            (branch) => branch.guid === "4318444d-c0be-11e1-9c78-001e670c9281"
          )
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

async function updateStockCostOzon() {
  // Dynamically import p-limit for ESM compatibility
  const pLimit = (await import("p-limit")).default;

  try {
    const allProducts = await getAllProduct();
    const offerIds = allProducts.map((product) => product.offer_id);
    const allProductsInfo = await getAllProductsInfo({ offer_id: offerIds });

    // Merge product info
    const mergedProducts = allProducts.map((product) => {
      const productInfo = allProductsInfo.find(
        (info) => info.offer_id === product.offer_id
      );
      return { ...product, ...productInfo };
    });

    // Limit concurrency for website requests
    const limit = pLimit(3); // Set concurrency limit (try 3, adjust as needed)
    await Promise.all(
      mergedProducts.map((product) =>
        limit(async () => {
          try {
            const websiteData = await getDataFromWebsite({
              vendorCode: product.offer_id,
            });
            product.websiteData = websiteData;
          } catch (error) {
            console.error(
              `Error fetching website data for product ${product.offer_id}:`,
              error.message
            );
            product.websiteData = null;
          }
        })
      )
    );

    const ozonPriceData = mergedProducts.map((item) => ({
      auto_action_enabled: "DISABLED",
      currency_code: "KZT",
      offer_id: item.offer_id,
      price: item.websiteData ? item.websiteData.price?.toString() || "0" : "0",
      old_price: item.websiteData
      ? item.websiteData.price &&
        item.websiteData.oldPrice &&
        item.websiteData.oldPrice <= item.websiteData.price
        ? "0"
        : (
        (item.websiteData.price < 49000 &&
          Math.abs(item.websiteData.price - item.websiteData.oldPrice) /
          item.websiteData.price > 0.05) ||
        (item.websiteData.price >= 49000 &&
          Math.abs(item.websiteData.price - item.websiteData.oldPrice) >
          3000)
        )
        ? item.websiteData.oldPrice?.toString() || "0"
        : "0"
      : "0",
      price_strategy_enabled: "DISABLED",
      product_id: item.product_id,
      quant_size: 1,
      vat: "0",
    }));

    const ozonStockData = mergedProducts.map((item) => ({
      offer_id: item.offer_id,
      product_id: item.product_id,
      quant_size: 1,
      stock: item.websiteData ? item.websiteData.stock || 0 : 0,
      warehouse_id: item.is_kgt ? 1020005000166135 : 1020005000165063,
    }));

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
