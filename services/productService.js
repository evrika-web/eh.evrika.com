const objectMapper = require("object-mapper");

function productMapping(product){
    var map = {

    }

    let mappedProduct = objectMapper(product, map);
    
    if(Array.isArray(mappedProduct.badges) && mappedProduct.badges.lenghts > 0){
        let tempbadges = mappedProduct.badges.map((badge)=>{
            return { id: badge.id,sort: badge.sort, published:badge.published,color: badge.color, name: badge.name, rich_description: badge.rich_description  }
        })
    }

    return  mappedProduct
}

module.exports = productMapping