const { MongoClient } = require('mongodb');
require('dotenv').config();

async function connectMongo(url) {
    const mongoClient = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true, monitorCommands: true });
    try {
        await mongoClient.connect();
        console.log('MongoDB connected');
        return mongoClient.db();
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

module.exports = connectMongo;
