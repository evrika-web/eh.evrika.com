const moment = require("moment");
const SimpleNodeLogger = require("simple-node-logger");
const dbQuerie = require("../database/dbQuerie");

opts = {
  logFilePath: `logs/${moment().format(
    "DD-MM-YYYY"
  )}-promotions-check-cart.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

async function checkCart(cart) {
  if (cart.length < 2) {
    console.log("Для каскадов нужно минимум два разных товаров");
    return {
      err: false,
      errMessage: "Для каскадов нужно минимум два разных товаров",
    };
  }
  var cartCascade = [];
  var cartNotCascade = [];
  var categoriesCount = [];
  var cartSorted = cart.sort(function (a, b) {
    return b.price - a.price;
  });
  // console.log("cartSorted ", cartSorted)

  for (var cartObj in cartSorted) {
    // console.log("cartSorted[cartObj] ", cartSorted[cartObj].article)
    var resultCheckExist = await dbCheckExistCascade(
      cartSorted[cartObj].article
    );
    // console.log("resultCheckExist ", resultCheckExist);
    if (resultCheckExist == undefined || resultCheckExist == []) {
      cartSorted[cartObj].cascade = false;
      cartNotCascade.push(cartSorted[cartObj]);
      console.log("Товара нет в каскадах ", cartSorted[cartObj].article);
      // console.log("cartNotCascade ", cartNotCascade);
    } else {
      if (cartSorted[cartObj].quantity <= 1) {
        var categoryIndex;
        var checkCategory = categoriesCount.some(
          (x) => x.category == cartSorted[cartObj].category
        );

        if (checkCategory) {
          categoriesCount.some((x, i) => {
            x.category == cartSorted[i].category;
            categoryIndex = i;
          });
        }

        var checkProductDublIndex;
        var checkProductDubl = cartCascade.some(
          (x) => x.article == cartSorted[cartObj].article
        );
        console.log("checkProductDubl ", checkProductDubl);

        if (checkProductDubl) {
          cartCascade.some((x, i) => {
            x.article == cartSorted[i].article;
            checkProductDublIndex = i;
          });
        }
        console.log("checkProductDublIndex ", checkProductDublIndex);
        var tempObj = {
          category: cartSorted[cartObj].category,
          count: 1,
        };
        if (checkProductDubl) {
          cartSorted[cartObj].cascade = false;
          cartNotCascade.push(cartSorted[cartObj]);
          cartCascade.splice(checkProductDublIndex, 1);
          console.log(
            "Количество товаров больше 1 ",
            cartSorted[cartObj].article
          );
        } else if (categoriesCount == [] || !checkCategory) {
          cartSorted[cartObj].docNumber = resultCheckExist.doc_number;
          cartSorted[cartObj].salePrice = cartSorted[cartObj].price;
          cartSorted[cartObj].cascade = true;
          categoriesCount.push(tempObj);
          cartCascade.push(cartSorted[cartObj]);
          // console.log( "1 if cartCascade ", cartCascade)
        } else if (checkCategory && categoriesCount[categoryIndex].count < 2) {
          // console.log( "2 if cartCascade ", cartCascade)
          cartSorted[cartObj].docNumber = resultCheckExist.doc_number;
          cartSorted[cartObj].salePrice = cartSorted[cartObj].price;
          cartSorted[cartObj].cascade = true;
          categoriesCount[categoryIndex].count += 1;
          cartCascade.push(cartSorted[cartObj]);
        } else {
          cartSorted[cartObj].cascade = false;
          cartNotCascade.push(cartSorted[cartObj]);
        }
      } else {
        cartSorted[cartObj].cascade = false;
        cartNotCascade.push(cartSorted[cartObj]);
        console.log(
          "Количество товаров больше 1 ",
          cartSorted[cartObj].article
        );
      }
    }
  }
  if(cartCascade.length == 1){
    cartCascade[0].cascade = false;
    delete cartCascade[0].docNumber
    delete cartCascade[0].salePrice
    cartNotCascade.push(cartCascade[0]);
    cartCascade.splice(0, 1);
    console.log(
      "Количество товаров участвующих в каскаде должно быть больше 1 "
    );
  }
  // console.log("cartCascade ", cartCascade);
  else if (cartCascade.length > 1) {
    try {
      var cascadePercents;
      await dbQuerie.percentsCascade(cartCascade[0].docNumber, (result) => {
        // console.log("percentsCascade ", result )
        if (Array.isArray(result) && result != [])
          cascadePercents = JSON.parse(result[0].cascadePercents);
        else {
          cascadePercents = [25, 50, 75];
        }
      });
    } catch (error) {
      console.log("error percentsCascade", error);
    }
    console.log("cascadePercents ", cascadePercents);
    var lastIndexCascadeArray = cartCascade.length - 1;
    console.log("lastIndexCascadeArray ", lastIndexCascadeArray);
    // console.log("docNumber ",cartCascade);
    var cascadePercent = 20;
    if (cascadePercents.length >= lastIndexCascadeArray) {
      cascadePercent = cascadePercents[lastIndexCascadeArray - 1];
      cartCascade[lastIndexCascadeArray].cascadePercent =
        cascadePercents[lastIndexCascadeArray - 1];
    } else {
      cascadePercent = cascadePercents[cascadePercents.length - 1];
      cartCascade[cascadePercents.length].cascadePercent =
        cascadePercents[cascadePercents.length - 1];
    }
    console.log("cascadePercent ", cascadePercent);
  } else {
    return { err: true, errMessage: "Нет товаров для каскада" };
  }

  var cartMapped = cartCascade.concat(cartNotCascade);
  if (cartMapped != []) return { err: false, cart: cartMapped };
  else {
    return { err: true, errMessage: "Something wrong" };
  }
}
async function dbCheckExistCascade(article) {
  var resulCheck;
  try {
    await dbQuerie.productExistCascade(article, (result) => {
      // console.log("productExistCascade ", result )
      resulCheck = result;
    });
  } catch (error) {
    return error;
  }
  return resulCheck[0];
}

module.exports = {
  checkCart,
};
