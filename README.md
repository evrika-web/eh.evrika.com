# External handler server

Express js server handler for all external services in [Evrika.com](https://evrika.com/)

- ^node js 16.0
- ✨Magic ✨

## Первый запуск проекта
```bash
npm install
```

## Для запуска проекта
запускается nodemon, при каждом сохранении в файлах проект автоматически 
перезапустит приложение
```bash
npm run server
```

## Для работы с БД был использован [Knexjs](https://knexjs.org/)
- создает файл для миграций
```bash
knex migrate:make migration_name
```
- обновляет БД по новым файлам миграции
```bash
knex migrate:latest 
```
- откат миграции
```bash
knex migrate:rollback 
```
- по очередный запуск не инициализированных миграций 
```bash
knex migrate:up 
```
- запускает выбранный файл миграции.
Пример названия файла 20221130080350_create_table_promotions.js
```bash
knex migrate:up migration_file
```
- по очередная отмена последних миграций
```bash
knex migrate:down  
```
- отменяет выбранный файл миграции.
Пример названия файла 20221130080350_create_table_promotions.js
```bash
knex migrate:down migration_file  
```
- Список статусов по миграции файлов
```bash
knex migrate:list 
```


## package.json с ссылками на документацию
- "axios": "^1.1.3" - для работы с запросами [Документация](https://www.npmjs.com/package/axios)
- "dotenv": "^16.0.3" - для получения данных с .env файла [Документация](https://www.npmjs.com/package/dotenv)
- "express": "^4.18.2"- сам сервер [Документация](https://www.npmjs.com/package/express)
- "fs": "^0.0.1-security"- для работы с файлами [Документация](https://nodejs.org/api/fs.html)
- "knex": "^2.3.0"- для работы с БД [Документация](https://knexjs.org/)
- "moment": "^2.29.4"- для работы с датами [Документация](https://www.npmjs.com/package/moment)
- "mysql": "^2.18.1"- для работы с БД [Документация](https://www.npmjs.com/package/mysql)
- "mysql-migrations": "^1.0.7"- для работы с миграциями [Документация](https://www.npmjs.com/package/mysql-migrations) 
- "node-schedule": "^2.1.0"- для создания крон задач [Документация](https://www.npmjs.com/package/node-schedule)
- "nodemon": "^2.0.20"- для запуска проекта и автоматического рестарта при изменении файлов [Документация](https://www.npmjs.com/package/nodemon)
- "simple-node-logger": "^21.8.12"- для создания логов [Документация](https://www.npmjs.com/package/simple-node-logger)
