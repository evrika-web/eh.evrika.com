const { getObjectId } = require("../database/mongoDb/mongoQuerie");
const getMongoApiRouter = require("../api/mongoApi");
const { maskPhone } = require("../utility/routerHelper/helpers");

const router=[
  getMongoApiRouter('/product', '/products', 'products', [], {
    singleDataFilter: (param) => ({ _id: parseInt(param) }), postBodyModifier:(body) => ({...body, _id:  parseInt(body.id)})
  }),
  getMongoApiRouter('/category', '/categories', 'categories', [], {
    singleDataFilter: (param) => ({ _id: parseInt(param) }), postBodyModifier:(body) => ({...body, _id:  parseInt(body.id)})
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
    singleDataFilter: (param) => ({ _id: parseInt(param) }), postBodyModifier:(body) => ({...body, _id:  parseInt(body.id)})
  }),
  getMongoApiRouter('/product-of-the-day', '/products-of-the-day', 'products', [], {
    singleDataFilter: (param) => ({ _id: getObjectId(param) }),
  }),
  getMongoApiRouter('/spec_value', '/spec_values', 'spec_values', [], {
    singleDataFilter: (param) => ({ _id: param.toString() }), postBodyModifier:(body) => ({...body, _id:  body.id.toString() })
  }),
  getMongoApiRouter('/city', '/cities', 'cities', [], {
    singleDataFilter: (param) => ({ _id: parseInt(param) }), postBodyModifier:(body) => ({...body, _id:  parseInt(body.id)})
  }),
  getMongoApiRouter('/halyk-market-product', '/halyk-market-products', 'halyk_market', [], {
    singleDataFilter: (param) => ({ _id: param.toString() }), postBodyModifier:(body) => ({...body, _id:  body.id.toString() })
  }),
  getMongoApiRouter('/pickup-point-marketplace', '/pickup-point-marketplaces', 'pickup_points_marketplace', [], {
    singleDataFilter: (param) => ({ _id: getObjectId(param) }),
  }),
  getMongoApiRouter('/promo_form_cfo', '/promo_forms_cfo', 'promo_form_cfo', [], {
    singleDataFilter: (param) => ({ _id: getObjectId(param) }), resultBodyModifier: (body)=>maskPhone(body)
  }),
  getMongoApiRouter('/promo_form_galmart', '/promo_forms_galmart', 'promo_form_galmart', [], {
    singleDataFilter: (param) => ({ _id: getObjectId(param) }), resultBodyModifier: (body)=>maskPhone(body)
  }),
  getMongoApiRouter('/promo_form', '/promo_forms', 'promo_form', [], {
    singleDataFilter: (param) => ({ _id: getObjectId(param) }), resultBodyModifier: (body)=>maskPhone(body)
  }),
  getMongoApiRouter('/promocode', '/promocodes', 'promocodes', [], {
    singleDataFilter: (param) => ({ _id: param.toString() }), singleResultBodyModifier : (body)=>(body), postBodyModifier:(body) => ({...body, _id:  body.id.toString() })
  }),
  getMongoApiRouter('/kaspi-market-product', '/kaspi-market-products', 'kaspi_market', [], {
    singleDataFilter: (param) => ({ _id: param.toString() }), postBodyModifier:(body) => ({...body, _id:  body.id.toString() })
  }),
  getMongoApiRouter('/marketplace-reason', '/marketplace-reasons', 'marketplace-reasons', [], {
    singleDataFilter: (param) => ({ _id: param.toString() })
  }),
  getMongoApiRouter('/brand', '/brands', 'brands', [], {
    singleDataFilter: (param) => ({ _id: parseInt(param) }), postBodyModifier:(body) => ({...body, _id:  parseInt(body.id)})
  }),
  getMongoApiRouter('/gift', '/gifts', 'gifts', [], {
    singleDataFilter: (param) => ({ _id: getObjectId(param) }),
  }),
]

module.exports = router;