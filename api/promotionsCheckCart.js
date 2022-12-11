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
    if (resultCheckExist == []) cartNotCascade.push(e);
    else {
      e.cascadeNumber = resultCheckExist[0].doc_number;
      if (e.quantity <= 1) {
        var tempObj = {category:e.category};
        if (
          categoriesCount == [] ||
          categoriesCount.indexOf(e.category) == -1
        ) {
          categoriesCount.push(e.category);
          cartCascade.concat(e);
        } else if (categoriesCount[e.category] < 2) {
          categoriesCount[e.category] += 1;
        }
      }
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
