const { getObjectId } = require("../database/mongoDb/mongoQuerie");
const getMongoApiRouter = require("../api/mongoApi");

const router=[
  getMongoApiRouter('/product', '/products', 'products', [], {
    singleDataFilter: (param) => ({ _id: parseInt(param) }),
  }),
  getMongoApiRouter('/category', '/categories', 'categories', [], {
    singleDataFilter: (param) => ({ _id: parseInt(param) }),
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
    singleDataFilter: (param) => ({ _id: parseInt(param) }),
  }),
  getMongoApiRouter('/product-of-the-day', '/products-of-the-day', 'products', [], {
    singleDataFilter: (param) => ({ _id: getObjectId(param) }),
  }),
  getMongoApiRouter('/spec_value', '/spec_values', 'spec_values', [], {
    singleDataFilter: (param) => ({ _id: param.toString() }),
  }),
  getMongoApiRouter('/city', '/cities', 'cities', [], {
    singleDataFilter: (param) => ({ _id: parseInt(param) }),
  }),
  getMongoApiRouter('/halyk-market-product', '/halyk-market-products', 'halyk_market', [], {
    singleDataFilter: (param) => ({ _id: param.toString() }),
  }),
  getMongoApiRouter('/pickup-point-marketplace', '/pickup-point-marketplaces', 'pickup_points_marketplace', [], {
    singleDataFilter: (param) => ({ _id: getObjectId(param) }),
  }),
  getMongoApiRouter('/promo_form_cfo', '/promo_forms_cfo', 'promo_form_cfo', [], {
    singleDataFilter: (param) => ({ _id: getObjectId(param) }),
  }),
  getMongoApiRouter('/promo_form_galmart', '/promo_forms_galmart', 'promo_form_galmart', [], {
    singleDataFilter: (param) => ({ _id: getObjectId(param) }),
  }),
]

module.exports = router;