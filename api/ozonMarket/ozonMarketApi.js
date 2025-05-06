const {
  getAllFromCollection,
  replaceOne,
  insertManyData,
  updateOne,
} = require("../../database/mongoDb/mongoQuerie");
const moment = require("moment");
const { dataFetching } = require("../../utility/dataFetching");
const { default: axios } = require("axios");

const configURL = {
  headers: {
    "Api-Key": process.env.OZON_API_KEY || "",
    "Client-Id": process.env.OZON_API_CLIENT_ID || "",
  },
  method: "POST",
};
const ozonURL = process.env.OZON_API_URL || "https://api-seller.ozon.ru";

async function getAllProduct() {
  configURL.data = {
    filter: {},
    last_id: "",
    limit: 1000,
  };
  try {
    const products = await axios(ozonURL + "/v3/product/list", configURL);
    return products.data.result.items;
  } catch (error) {
    console.error("Error fetching products from Ozon API:", error.message);
    throw error;
  }
}

async function getAllProductsInfo(data) {
  configURL.data = data;
  try {
    const products = await axios(ozonURL + "/v3/product/info/list", configURL);
    return products.data.items;
  } catch (error) {
    console.error("Error fetching products from Ozon API:", error.message);
    throw error;
  }
}
async function updateCostsProduct({ data }) {
  try {
    const products = await axios.post(
      ozonURL + "/v1/product/import/prices",
      data,
      configURL
    );
    return products.status;
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
    const products = await axios.post(
      ozonURL + "/v2/products/stocks",
      data,
      configURL
    );
    return products.status;
  } catch (error) {
    console.error(
      "Error fetching update stocks of products from Ozon API:",
      error.message
    );
    throw error;
  }
}

async function getDataFromWebsite({ vendorCode }) {
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
    } else {
      throw new Error("Failed to fetch data from website");
    }
  } catch (error) {
    console.error("Error fetching data from website:", error.message);
    throw error;
  }
}

async function updateStockCostOzon() {
  const allProducts = await getAllProduct();
  const offerIds = allProducts.map((product) => product.offer_id);
  const allProductsInfo = await getAllProductsInfo({ offer_id: offerIds });
  const mergedProducts = allProducts.map((product) => {
    const productInfo = allProductsInfo.find(
      (info) => info.offer_id === product.offer_id
    );
    return { ...product, ...productInfo };
  });
  allProducts.length = 0;
  allProducts.push(...mergedProducts);

  for (const product of allProducts) {
    try {
      const websiteData = await getDataFromWebsite({
        vendorCode: product.offer_id,
      });
      product.websiteData = websiteData; // Сохраняем данные в объекте
    } catch (error) {
      console.error(
        `Error fetching website data for product ${product.offer_id}:`,
        error.message
      );
      product.websiteData = null; // Устанавливаем null, если произошла ошибка
    }
  }

  const ozonPriceData = allProducts.map((item) => {
    return {
      auto_action_enabled: "DISABLED",
      currency_code: "KZT",
      offer_id: item.offer_id,
      price: item.websiteData ? item.websiteData.price.toString() || "0" : "0",
      old_price: item.websiteData
        ? item.websiteData.oldPrice.toString() || "0"
        : "0",
      price_strategy_enabled: "DISABLED",
      product_id: item.product_id,
      quant_size: 1,
      vat: "0",
    };
  });
  const ozonStockData = allProducts.map((item) => {
    var warehouse_id = 1020005000165063;
    if (item.is_kgt) {
      warehouse_id = 1020005000166135;
    }
    return {
      offer_id: item.offer_id,
      product_id: item.product_id,
      quant_size: 1,
      stock: item.websiteData ? item.websiteData.stock || 0 : 0,
      warehouse_id: warehouse_id,
    };
  });
  var responseCosts = null;
  var responseStocks = null;
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
}
module.exports = {
  getAllProduct,
  updateCostsProduct,
  updateStocksProduct,
  updateStockCostOzon,
};
