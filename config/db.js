// config/db.js

const mongoose = require('mongoose');
require('dotenv').config(); // Для использования переменных окружения

const mongoURI = process.env.MONGODB_URI || 'mongodb://username:password@localhost:27017/yourdbname';

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Таймаут подключения (опционально)
    });
    console.log('Успешно подключено к MongoDB');
  } catch (err) {
    console.error('Ошибка подключения к MongoDB:', err);
    process.exit(1); // Завершение процесса при ошибке подключения
  }
};

// Обработка событий соединения
mongoose.connection.on('connected', () => {
  console.log('Mongoose подключен к', mongoURI);
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose ошибка подключения:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose отключен');
});

module.exports = connectDB;
