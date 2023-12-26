const { getObjectId } = require("../database/mongoDb/mongoQuerie");
const getMongoApiRouter = require("../api/catalog/mongoApi");

const router=[
  getMongoApiRouter('/product', '/products', 'products', [], {
    singleDataFilter: (param) => ({ _id: parseInt(param) }),
  }),
  getMongoApiRouter('/category', '/categories', 'categories', [], {
    singleDataFilter: (param) => ({ _id: getObjectId(param) }),
  }),
  getMongoApiRouter('/filter', '/filters', 'filters', [], {
    singleDataFilter: (param) => ({ _id: getObjectId(param) }),
  }),
  getMongoApiRouter('/spec', '/specs', 'specs', [], {
    singleDataFilter: (param) => ({ _id: getObjectId(param) }),
  }),
  getMongoApiRouter('/stock', '/stocks', 'stocks', [], {
    singleDataFilter: (param) => ({ _id: getObjectId(param) }),
  }),
  getMongoApiRouter('/branch', '/branches', 'branches', [], {
    singleDataFilter: (param) => ({ _id: getObjectId(param) }),
  }),
  getMongoApiRouter('/product-of-the-day', '/products-of-the-day', 'product_of_the_day', [], {
    singleDataFilter: (param) => ({ _id: getObjectId(param) }),
  }),
  getMongoApiRouter('/spec_value', '/spec_values', 'spec_values', [], {
    singleDataFilter: (param) => ({ _id: getObjectId(param) }),
  }),
]

module.exports = router;