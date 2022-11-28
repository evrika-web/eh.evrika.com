var mysql = require('mysql');
var migration = require('mysql-migrations');
require('dotenv').config();

//db connection
var connection = mysql.createPool({
  connectionLimit : 10,
  host     : process.env.DB_HOST,
  port     : process.env.DB_PORT,
  user     : process.env.DB_USER,
  password : process.env.DB_PASSWORD,
  database : process.env.DB_NAME
});

//initialization of migrations
migration.init(connection, __dirname + '/database/migrations', function() {
  console.log("finished running migrations");
});