// elastic/elasticSync.js

const Product = require('../../models/Product');
const client = require('./elasticClient');

async function syncProductToElastic(product) {
  await client.index({
    index: 'products',
    id: product._id.toString(),
    body: {
      name: product.name,
      description: product.description || '',
      vendorCode: product.vendorCode || '',
      vendor: product.vendor || '',
      slug: product.slug,
      brandId: product.brandId,
      categoryId: product.categoryId,
      price: product.price,
      oldprice: product.oldprice,
      picture: product.picture,
      specs: product.specs.map(spec => spec.value).join(' '),
      popularity: product.popularity || 0,
      sales: product.sales || 0,
      suggest: {
        input: [product.name]
      }
      // Добавьте другие поля по необходимости
    }
  });
  await client.indices.refresh({ index: 'products' });
}

async function removeProductFromElastic(productId) {
  await client.delete({
    index: 'products',
    id: productId.toString()
  }).catch(err => {
    if (err.meta.statusCode === 404) {
      console.log(`Продукт ${productId} уже отсутствует в индексе`);
    } else {
      throw err;
    }
  });
  console.log(`Удалён продукт из индекса: ${productId}`);
}

async function watchChanges() {
  const changeStream = Product.watch();

  changeStream.on('change', async (change) => {
    try {
      if (change.operationType === 'insert' || change.operationType === 'update' || change.operationType === 'replace') {
        const product = await Product.findById(change.documentKey._id);
        await syncProductToElastic(product);
      } else if (change.operationType === 'delete') {
        await removeProductFromElastic(change.documentKey._id);
      }
    } catch (err) {
      console.error('Ошибка при синхронизации с ElasticSearch:', err);
    }
  });

  console.log('Начато отслеживание изменений в коллекции products');
}

async function fullIndexing() {
  try {
    const products = await Product.find();
    console.log(`Найдено ${products.length} продуктов для пакетной индексации`);

    const body = [];

    products.forEach(product => {
      body.push({
        index: { _index: 'products', _id: product._id.toString() }
      });
      body.push({
        name: product.name,
        description: product.description || '',
        vendorCode: product.vendorCode || '',
        vendor: product.vendor || '',
        slug: product.slug,
        brandId: product.brandId,
        categoryId: product.categoryId,
        price: product.price,
        oldprice: product.oldprice,
        picture: product.picture,
        specs: product.specs.map(spec => spec.value).join(' '),
        popularity: product.popularity || 0,
        sales: product.sales || 0,
        suggest: {
          input: [product.name]
        }
        // Добавьте другие поля по необходимости
      });
    });

    const { body: bulkResponse } = await client.bulk({ refresh: true, body });

    if (bulkResponse.errors) {
      const erroredDocuments = [];
      bulkResponse.items.forEach((action, i) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            status: action[operation].status,
            error: action[operation].error,
            operation: body[i * 2],
            document: body[i * 2 + 1]
          });
        }
      });
      console.error('Ошибки при пакетной индексации:', bulkResponse.errors);
    } else {
      console.log('Пакетная индексация успешно завершена');
    }
  } catch (error) {
    console.error('Ошибка при полной индексации:', error);
  }
}

async function deleteIndex() {
  try {
    const exists = await client.indices.exists({ index: 'products' });
    if (exists.body) {
      await client.indices.delete({ index: 'products' });
      console.log('Индекс "products" успешно удалён');
    } else {
      console.log('Индекс "products" не существует');
    }
  } catch (error) {
    console.error('Ошибка при удалении индекса:', error);
  }
}

module.exports = { watchChanges, fullIndexing, deleteIndex};
