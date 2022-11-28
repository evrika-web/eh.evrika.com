var mysql = require('mysql');
require('dotenv').config();
const moment = require("moment");

const SimpleNodeLogger = require("simple-node-logger");
opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-db.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);
//db connection
var connection = mysql.createPool({
    connectionLimit : 10,
    host     : process.env.DB_HOST,
    port     : process.env.DB_PORT,
    user     : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME
  });

// function add promotions to db
async function addPromotion(doc_number, type, start_date, end_date, percents, products,participate){
  connection.beginTransaction(function(err) {  
    if (err) { throw err; }
  var insertData=[doc_number, type, start_date, end_date, JSON.stringify(percents), JSON.stringify(products), participate]
    var sql = "INSERT INTO  promotions (doc_number, type, start_date, end_date, percents, products, participate) VALUES (?,?,?,?,?,?,?)";
    connection.query(sql, insertData, function(err) {
        if(err) {
          throw err; 
        }
      });
      return "1 record inserted";})
};

//function for searching product in promo by article
async function searchProductInPromotion(productId){
  
  var sql = 'select * from promotions p where JSON_CONTAINS(p.products, ' + JSON.stringify(productId)+')'
  var result = connection.query(sql,function(err, data, fields){
    if(err) {
      console.log('Error: ' + err)
      throw err;       
    }
  });
  return result;
}

//function for searching product in promo by article
async function getPromoID(){
  var sql = 'select * from promotions p where JSON_CONTAINS(p.products, ' + JSON.stringify(productId)+')'
  var result = connection.query(sql,function(err, data, fields){
    if(err) {
      console.log('Error: ' + err)
      throw err;       
    }return data;
  });
  return result;
}

//function for activity check of promotion by end_date
async function checkDatePromo(){
  var sql = 'UPDATE promotions p SET active = false WHERE p.active="1" and p.end_date < curdate()'
  var result
  connection.query(sql , function( err, data, fields ){
    if(err) {
      console.log('Error: ' + err)

      result = err
      throw err;       
    }
    else{
      if(data.changedRows===0){
        result = 'Check end date: Nothing to update'        
        log.info( result );
      }
      else{
        result = 'Check end date: Updated ' + data.changedRows + ' rows'       
        log.info( result );
      }
    }
  });
  return result
}

module.exports={
    addPromotion,
    searchProductInPromotion,
    getPromoID,
    checkDatePromo
};