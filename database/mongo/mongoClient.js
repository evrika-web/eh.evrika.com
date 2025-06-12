const MongoClient = require("mongodb").MongoClient;

function connectMongo(url) {
    const mongoClient = new MongoClient(url,  { monitorCommands: true });
    return mongoClient.connect();
}

module.exports = connectMongo;