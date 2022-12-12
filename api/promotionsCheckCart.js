async function checkCart(cart) {
  if (cart.length < 2) return cart;

  var cartSorted = cart.sort(function (a, b) {
    if (a.price > b.price) {
      return 1;
    } else if (a.price < b.price) {
      return -1;
    } else {
      return 0;
    }
  });
  console.log("sorted cart ", cartSorted);
  var cartCascade = [];
  var cartNotCascade = [];
  var categoriesCount = [];
  cartSorted.forEach((e) => {
    var resultCheckExist = dbCheck(e.article);
    if (resultCheckExist == []) {cartNotCascade.push(e); console.log("Товара нет в каскадах ", e.article)}
    else {
      if (e.quantity <= 1) {
        var tempObj = {
          category: e.category,
          count: 0,
        };
        var categoryIndex
        var checkCategory = categoriesCount.some(x => x.category == e.category);        
        console.log("checkCategory ", checkCategory)
        console.log("categoryIndex ", categoryIndex)
        if (
          categoriesCount == [] ||
          !checkCategory
        ) {
          e.cascadeNumber = resultCheckExist[0].doc_number;
          e.cascade = true;
          categoriesCount.push(tempObj);
          cartCascade.concat(e);
        } else if (checkCategory && categoriesCount[categoryIndex].count < 2) {          
          e.cascadeNumber = resultCheckExist[0].doc_number;
          e.cascade = true;
          categoriesCount[categoryIndex].count += 1;
          cartCascade.concat(e);
        }
      }
      else{cartNotCascade.push(e); console.log("Количество товаров больше 1 ", e.article)}
    }
  });
  return cartMapped;
}
async function dbCheck(article) {
  var resulCheck;
  await dbQuerie.productExistCascade(article, (result) => {
    resulCheck = result;
  });
  return resulCheck;
}
module.exports = {
  checkCart,
};
