// elastic/elasticSetup.js

const client = require("./elasticClient");
const Product = require("../../models/Product");

async function createIndex() {
  const indexExists = await client.indices.exists({ index: "products" });
  if (indexExists) {
    console.log('Индекс "products" уже существует');
  } else {
    await client.indices.create({
      index: "products",
      body: {
        settings: {
          analysis: {
            filter: {
              synonym_filter: {
                type: "synonym",
                synonyms: [
                  "телефон, смартфон, мобильник",
                  "ноутбук, лэптоп, компьютер",
                  // Добавьте другие синонимы по необходимости
                ],
              },
              russian_stop: {
                type: "stop",
                stopwords: "_russian_",
              },
              ngram_filter: {
                type: "ngram",
                min_gram: 2,
                max_gram: 3,
              },
            },
            analyzer: {
              custom_analyzer: {
                tokenizer: "standard",
                filter: [
                  'lowercase',
                  'russian_stop',
                  'synonym_filter',
                  'ngram_filter'
                ]
              },
            },
          },
        },
        mappings: {
          properties: {
            name: {
              type: "text",
              analyzer: "custom_analyzer",
              search_analyzer: 'standard',
              fields: {
                raw: { type: "keyword" },
              },
            },
            description: {
              type: "text",
              analyzer: "custom_analyzer",
              search_analyzer: 'standard',
            },
            specs: {
              type: "text",
              analyzer: "custom_analyzer",
              search_analyzer: 'standard',
            },
            popularity: { type: "integer" },
            vendorCode: {
              type: "text",
              analyzer: "custom_analyzer",
            },
            vendor: {
              type: "text",
              analyzer: "custom_analyzer",
              search_analyzer: 'standard',
              fields: {
                raw: { type: "keyword" } // Добавлено подполе raw
              }
            },
            slug: {
              type: "text",
            },
            brandId: { type: "integer" },
            categoryId: { type: "integer" },
            price: { type: "integer" },
            oldprice: { type: "integer" },
            picture: {
              type: "text",
            },
            sales: { type: "integer" },
            suggest: {
              type: 'completion'
            },
            // Добавьте другие поля по необходимости
          },
        },
      },
    });

    console.log('Индекс "products" успешно создан');

    // Первоначальная индексация существующих данных
    const products = await Product.find();
    console.log("🚀 ~ createIndex ~ products:", products[0]);
    for (const product of products) {
      await client.index({
        index: "products",
        id: product._id.toString(),
        body: {
          name: product.name,
          description: product.description || "",
          vendorCode: product.vendorCode || "",
          vendor: product.vendor || "",
          slug: product.slug,
          brandId: product.brandId,
          categoryId: product.categoryId,
          price: product.price,
          oldprice: product.oldprice,
          picture: product.picture,
          specs: product.specs.map((spec) => spec.value).join(" "),
          popularity: product.popularity || 0,
          sales: product.sales || 0,
          suggest: {
            input: [product.name],
          },
          // Добавьте другие поля по необходимости
        },
      });
    }

    await client.indices.refresh({ index: "products" });
    console.log("Первоначальная индексация завершена");
  }
}

module.exports = createIndex;
