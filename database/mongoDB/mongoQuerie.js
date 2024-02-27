const connectMongo = require('./mongoClient');
const mongodb = require('mongodb');
require('dotenv').config();
let db = null;
async function connectDb(url, dbName) {
    try {
        if (!db) {
            const client = await connectMongo(url);
            db = await client.db(dbName);
            return true;
        }
    } catch (err) {
        throw err;
    }
    return false;
}

async function getAllFromCollection(collectionName, fields = {}, filter = {}, page='all', sort, limit =24) {
    const collection = db.collection(collectionName);
    if (sort === "cost-desc") sort = { price: -1 };
    else if (sort === "cost-asc") sort = { price: 1 };
    else if (sort === "created-at") sort = { 'created-at': -1 };
    else if (sort === "rating") sort = { rating: -1 };
    else{
        sort = { popular: -1 };
    }
    count  = await collection.countDocuments(filter)
    if ( count === 0) {
        return [];
    }
    if(page==='all'){
        const cursor = collection.find(filter).project(fields).sort(sort);
        const result = await cursor.toArray();
        return {result:result,count: count};
    } else {
        const cursor = collection.find(filter, {
            limit: limit,
            skip: (Number(page)-1)*limit,
            sort: sort
          }).project(fields);
        const result = await cursor.toArray();
        return {result:result, count: count, pages: Math.ceil(count/limit)};
    }    
}

async function getMultipleFromCollection(collectionName, fields = {}, filter = {}, limit = 10, offset = 0, sort = {}) {
    const collection = db.collection(collectionName);
    const cursor = collection.find(filter).project(fields).limit(limit).skip(offset).sort(sort);
    if ((await cursor.count()) === 0) {
        return [];
    }
    const result = await cursor.toArray();
    return result;
}

async function getOneFromCollectionByFilter(collectionName, filter = {}) {
    const collection = db.collection(collectionName);
    const data = collection.findOne(filter);
    return data;
}

async function insertOneData(collectionName, data) {
    const collection = db.collection(collectionName);
    const result = await collection.insertOne(data);
    const { insertedCount, insertedId } = result;
    return { insertedCount, insertedId, };
}

async function insertManyData(collectionName, data) {
    const collection = db.collection(collectionName);
    const result = await collection.insertMany(data);
    return { insertedCount: result.insertedCount, insertedId: result.insertedId }
}

async function deleteOne(collectionName, filter = {}) {
    const collection = db.collection(collectionName);
    const result = await collection.deleteOne(filter);
    return result.deletedCount;
}

async function update(collectionName, update, filter = {}) {
    const collection = db.collection(collectionName);
    const result = await collection.updateMany(filter, update);
    return result.modifiedCount;
}

async function updateOne(collectionName, update, filter = {}) {
    const collection = db.collection(collectionName);
    const result = await collection.updateOne(filter, update);
    return result.modifiedCount;
}

async function findOneAndReplace(collectionName, replace, filter = {}) {
    const collection = db.collection(collectionName);
    const result = await collection.findOneAndReplace(filter, replace);
    return result.modifiedCount;
}
async function replaceOne(collectionName, replace, filter = {}) {
    const collection = db.collection(collectionName);
    const result = await collection.replaceOne(filter, replace);
    return result.modifiedCount;
}

async function getDistinct(collectionName, fieldName = '', filter = {}) {
    const collection = db.collection(collectionName);
    const result = collection.distinct(fieldName, filter);
    return result;
}

async function getCount(collectionName, filter = {}) {
    const collection = db.collection(collectionName);
    const result = collection.count(filter);
    return result;
}

function getObjectId(id) {
    return new mongodb.ObjectId(id);
}

async function aggregateCollection(collectionName, aggregate = []) {
    const collection = db.collection(collectionName);
    const data = await collection.aggregate(aggregate);
    return await data.toArray();
}

module.exports = {
    getAllFromCollection,
    getOneFromCollectionByFilter,
    insertOneData,
    deleteOne,
    getObjectId,
    update,
    updateOne,
    getDistinct,
    getMultipleFromCollection,
    insertManyData,
    getCount,
    connectDb,
    aggregateCollection,
    findOneAndReplace,
    replaceOne
}