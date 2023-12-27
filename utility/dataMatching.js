function catalogMatching(dirtyData, type = "products") {
  var cleanData = {};
  cleanData.$and = [];
  
  //main filters matching
  if (dirtyData.filters && Object.keys(dirtyData.filters).length !== 0) {
    cleanData.price = {};
    for (const key in dirtyData.filters) {
      if (key === "cost_to") {
        if(type!=='prices')
        cleanData.price.$lte = parseInt(dirtyData.filters.cost_to[0]);
        delete cleanData.cost_to;
      } else if (key === "cost_from") {
        if(type!=='prices')
        cleanData.price.$gte = parseInt(dirtyData.filters.cost_from[0]);
        delete cleanData.cost_from;
      } else if (key === "brand") {
        var tempObj = { $or: [] };
        dirtyData.filters[key].map((e) => {
          tempObj.$or.push({ vendor: e });
        });
        cleanData.$and.push(tempObj);
      } else if (type === "filters") {
        continue;
      } else {
        var tempObj = { $or: [] };
        dirtyData.filters[key].map((e) => {
          tempObj.$or.push({ ["specs.specslug"]: key, ["specs.valueslug"]: e });
        });
        cleanData.$and.push(tempObj);
      }
    }
    if (Object.keys(cleanData.price).length === 0) {
      delete cleanData.price;
    }
    else{
      cleanData.$and.push(cleanData.price);
      delete cleanData.price;
    }
  }

  //other filters matching
  cleanData.$and.push({categoryId:parseInt(dirtyData.category_id) || 234});
  cleanData.$and.push({["locations.id"]:dirtyData.city_id.toString() || "1"});

  if (cleanData.$and.length === 0) {
    delete cleanData.$and;
  }
  
  return cleanData;
}

function shallowEqualityCheck(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }
  return true;
}
(module.exports = catalogMatching), shallowEqualityCheck;
