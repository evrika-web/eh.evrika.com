// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */

require('dotenv').config();
module.exports = {

  //Тестовое подключение к БД
  development: {
    client: 'mysql',
    connection: {
      host:     process.env.DATABASE_HOST,
      port:     process.env.DATABASE_PORT,
      database: process.env.DATABASE_NAME,
      user:     process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD
    },
    migrations: {
      directory: __dirname + '/database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: __dirname + '/database/seeds'
    },
    useNullAsDefault: true
  },

  //Боевое подключение к БД
  production: {
    client: 'mysql',
    connection: {
      host:     process.env.DATABASE_HOST,
      port:     process.env.DATABASE_PORT,
      database: process.env.DATABASE_NAME,
      user:     process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD
    },
    migrations: {
      directory: __dirname + '/database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: __dirname + '/database/seeds'
    },
    useNullAsDefault: true
  }

};
