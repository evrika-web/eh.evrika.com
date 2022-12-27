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
  var oldCostDiscount = 0;
  cart.forEach(element => {
    oldCostDiscount += element.price - element.salePrice;
  });
  console.log("oldCostDiscount ", oldCostDiscount)
  // Проверка на кол-во товаров, должно быть больше 1
  if (cart.length < 2) {
    console.log("Для каскадов нужно минимум два разных товаров");
    cart.forEach((element) => {
      element.cascade = false;
    });
    return {
      err: true,
      cascadeCart: false,
      cart: cart,
      errMessage: "Для каскадов нужно минимум два разных товаров",
    };
  }
  // инициализация основных параметров
  var cartCascade = [];
  var cartNotCascade = [];
  var categoriesCount = [];
  var cartSorted = cart.sort(function (a, b) {
    return b.salePrice - a.salePrice;
  });

  //получение номера документа активного каскада
  var docNumberActiceCascade = "";
  await dbQuerie.getActivePromotionsID((promotionsIDs) => {
    promotionsIDs.map((e, i) => {
      if (e.type == "cascade") {
        docNumberActiceCascade = e.doc_number;
      }
    });
  });

  for (var cartObj in cartSorted) {
    //вызов функции для проверки наличия товара в исключениях каскада
    var resultCheckExist = await dbCheckExistCascade(
      cartSorted[cartObj].article
    );

    //Проверка на наличие товара в каскадах
    if (resultCheckExist == undefined || resultCheckExist == false) {
      cartSorted[cartObj].cascade = false;
      cartNotCascade.push(cartSorted[cartObj]);
      console.log("Товар в исключении каскада ", cartSorted[cartObj].unique_id);
    }
    // Проверка на услугу, услуги не участвуют в каскадах
    else if (cartSorted[cartObj].isService == true) {
      cartSorted[cartObj].cascade = false;
      cartNotCascade.push(cartSorted[cartObj]);
      console.log(
        "Услуги не участвуют в каскадах ",
        cartSorted[cartObj].unique_id
      );
    } else {
      //Проверка на количество одного товара, не должно быть больше 1
      if (cartSorted[cartObj].quantity <= 1) {
        //Получение данных для проверки категорий
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

        //Получение данных для проверки дубля товаров
        var checkProductDublicateIndex;
        var checkProductDublicate = cartCascade.some(
          (x) => x.article == cartSorted[cartObj].article
        );

        if (checkProductDublicate) {
          cartCascade.some((x, i) => {
            x.article == cartSorted[i].article;
            checkProductDublicateIndex = i;
          });
        }

        //Получение данных для проверки цен
        var checkPriceRange = true;
        if (cartCascade.length != 0) {
          checkPriceRange = cartCascade.some(
            (x) => Math.abs(x.salePrice - cartSorted[cartObj].salePrice) > 10
          );
        } else {
          checkPriceRange = true;
        }

        //Временный объект для отправки в массив категорий
        var tempObj = {
          category: cartSorted[cartObj].category,
          count: 1,
        };

        //Проверка на наличие дубликата товаров, если дубликат товара то убираем из каскада оба
        if (checkProductDublicate) {
          cartSorted[cartObj].cascade = false;
          cartNotCascade.push(cartSorted[cartObj]);
          delete cartSorted[checkProductDublicateIndex].docNumber;
          // delete cartSorted[checkProductDublicateIndex].salePrice;
          cartSorted[checkProductDublicateIndex].cascade = false;
          cartNotCascade.push(cartSorted[checkProductDublicateIndex]);
          cartCascade.splice(checkProductDublicateIndex, 1);
          console.log(
            "Обнаружен дубль товара в корзине ",
            cartSorted[cartObj].unique_id
          );
        }

        //Проверка на кол-во категорий (если это первый товар в проверке), разницы цены (должно быть больше 10)
        else if (
          (categoriesCount == [] && checkPriceRange) ||
          (!checkCategory && checkPriceRange)
        ) {
          cartSorted[cartObj].docNumber = docNumberActiceCascade;
          // cartSorted[cartObj].salePrice = cartSorted[cartObj].salePrice;
          cartSorted[cartObj].cascade = true;
          categoriesCount.push(tempObj);
          cartCascade.push(cartSorted[cartObj]);
        }

        //Проверка на кол-во категорий (должно быть не больше 2 товаров с одной категории), разницы цены (должно быть больше 10)
        else if (
          checkCategory &&
          categoriesCount[categoryIndex].count < 2 &&
          checkPriceRange
        ) {
          cartSorted[cartObj].docNumber = docNumberActiceCascade;
          // cartSorted[cartObj].salePrice = cartSorted[cartObj].price;
          cartSorted[cartObj].cascade = true;
          categoriesCount[categoryIndex].count += 1;
          cartCascade.push(cartSorted[cartObj]);
        }

        //Все что не прошло проверку цены отправляем в массив не каскадов
        else if (checkPriceRange == false) {
          console.log(
            "Товар не прошел проверку цены ",
            cartSorted[cartObj].unique_id
          );
          cartSorted[cartObj].cascade = false;
          cartNotCascade.push(cartSorted[cartObj]);
        } else {
          cartSorted[cartObj].cascade = false;
          cartNotCascade.push(cartSorted[cartObj]);
        }
      } else {
        cartSorted[cartObj].cascade = false;
        cartNotCascade.push(cartSorted[cartObj]);
        console.log(
          "Количество товаров больше 1 ",
          cartSorted[cartObj].unique_id
        );
      }
    }
  }

  var cascadeCart = true;

  //Проверка если кол-во товаров в каскаде = 1 (Должно быть больше 1 )
  if (cartCascade.length == 1) {
    cartCascade[0].cascade = false;
    delete cartCascade[0].docNumber;
    // delete cartCascade[0].salePrice;
    cartNotCascade.push(cartCascade[0]);
    cartCascade.splice(0, 1);
    console.log(
      "Количество товаров участвующих в каскаде должно быть больше 1"
    );
    cascadeCart = false;
    return {
      err: true,
      cascadeCart,
      cart: cartNotCascade,
      errMessage:
        "Количество товаров участвующих в каскаде должно быть больше 1",
    };
  }

  // Если товаров в каскадах больше одного
  else if (cartCascade.length > 1) {
    // Получение процентов каскада
    try {
      var cascadePercents;
      await dbQuerie.percentsCascade(cartCascade[0].docNumber, (result) => {
        if (Array.isArray(result) && result != []) {
          cascadePercents = JSON.parse(result[0].cascadePercents);
        }
        //Если вышла ошибка берем стандартные проценты каскада
        else {
          cascadePercents = [25, 50, 75];
        }
      });
    } catch (error) {
      console.log("error percentsCascade", error);
    }

    // Поиск последнего товара в каскадах для приравнивания скидки
    var lastIndexCascadeArray = cartCascade.length - 1;
    var cascadePercent = 20;
    var cascadeDiscountInitial = 0;
    if (cascadePercents.length >= cartCascade.length) {
      cascadePercent = cascadePercents[lastIndexCascadeArray - 1];
      cartCascade[lastIndexCascadeArray].cascadePercent =
        cascadePercents[lastIndexCascadeArray - 1];
      cascadeDiscountInitial = cartCascade[lastIndexCascadeArray].salePrice * (cascadePercent);
    } else {
      cascadePercent = cascadePercents[cascadePercents.length - 1];
      cartCascade[cascadePercents.length].cascadePercent =
      cascadePercents[cascadePercents.length-1];
      cascadeDiscountInitial = cartCascade[cascadePercents.length].salePrice * cascadePercent;
    
      for (var i = lastIndexCascadeArray; i > cascadePercents.length ; i--) {
        cartCascade[i].cascade = false;
        delete cartCascade[i].docNumber;
        // delete cartCascade[i].salePrice;
        cartNotCascade.push(cartCascade[i]);
        console.log(
          "Убираем товар который не вошел в расчет скидки каскада",
          cartCascade[i].unique_id
        );
        cartCascade.splice(i, 1);
      }
    }
    // Вычисления скидки для всех товаров каскада
    var overallSum=0
    cartCascade.forEach(element => {
      overallSum += element.salePrice
    });
    
    var salePercentForAllProducts = cascadeDiscountInitial / overallSum;
    var salePercentForAllProductsToFixed2=Number(salePercentForAllProducts.toFixed(2));
    if(salePercentForAllProductsToFixed2<salePercentForAllProducts){
      salePercentForAllProductsToFixed2 += 0.01;
    }
    var cascadeDiscount = 0;
    cartCascade.forEach(element => {
      var saleForProduct= Number((element.salePrice*(salePercentForAllProductsToFixed2/100)).toFixed(2));
      element.salePrice = Number((element.salePrice - saleForProduct).toFixed(0));
      element.appliedPercent = Number(salePercentForAllProductsToFixed2.toFixed(2));
      element.sum = element.salePrice * element.quantity;
      cascadeDiscount += element.price - element.salePrice;
    });
  } else {
    cascadeCart = false;
    return {
      err: false,
      cascadeCart,
      cart: cartNotCascade,
      errMessage: "Нет товаров для каскада",
    };
  }

  // Соединяем массив каскадов с массивом не каскадов для отправки результата
  var cartMapped = cartCascade.concat(cartNotCascade);
  if (cartMapped != []) {
    cascadeCart = true;
    return { err: false, cascadeCart, cart: cartMapped, cascadeDiscount: Number((cascadeDiscount).toFixed(0)), oldCostDiscount};
  } else {
    return { err: true, errMessage: "Something went wrong" };
  }
}

//запрос в БД для проверки наличия товара в каскадах
async function dbCheckExistCascade(article) {
  var resulCheck = false;
  try {
    await dbQuerie.productExistCascade(article, (result) => {
      if (result.length == 0) {
        resulCheck = true;
      } else {
        resulCheck = false;
      }
    });
  } catch (error) {
    return error;
  }
  return resulCheck;
}
module.exports = {
  checkCart,
};
