const { maskPhoneNumber } = require("../maskData")

function maskPhone(body){  
    maskedResult = body.result.map((e) => ({
    ...e,
    phone: maskPhoneNumber(e.phone),
  }))
  body = { result: maskedResult, count: body.count }
  return body
}

module.exports = {
    maskPhone
}