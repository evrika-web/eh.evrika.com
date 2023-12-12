const { getObjectId } = require("../database/mongoDb/mongoQuerie");
const getMongoApiRouter = require("../api//catalog/mongoApi");

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
]

module.exports = router;