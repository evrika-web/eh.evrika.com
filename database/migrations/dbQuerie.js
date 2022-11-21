var mysql = require('mysql');
require('dotenv').config();

var connection = mysql.createPool({
    connectionLimit : 10,
    host     : process.env.DB_HOST,
    port     : process.env.DB_PORT,
    user     : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME
  });

async function setPromotion(doc_number, type, start_date, end_date, percents, products,participate){
    var result;
    pool.query("INSERT INTO  (doc_number, type, start_date, end_date, percents, products,participate) VALUES (?,?,?,?,?,?,?)", [doc_number, type, start_date, end_date, percents, products,participate], function(err, data) {
        if(err) return console.log(err);       
        result= data; 
      });
      return await result;
};
module.exports={
    setPromotion,
};