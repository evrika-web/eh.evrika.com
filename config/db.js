// db.js - Подключение к базе данных
const mongoose = require('mongoose');

async function connectDBmongoose() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Mongoose connected successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1); // Завершение процесса в случае ошибки подключения
    }
}

module.exports = connectDBmongoose;
