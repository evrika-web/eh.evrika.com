const connectMongo = require("./mongoClient");
const mongodb = require("mongodb");
const { GridFSBucket } = require("mongodb");
require("dotenv").config();

let db = null;
let bucket = null;
let client = null;

async function connectDb(url, dbName) {
  try {
    if (!db) {
      client = await connectMongo(url);
      db = await client.db(dbName);
      bucket = new GridFSBucket(db);
      return true;
    }
  } catch (err) {
    throw err;
  }
  return false;
}

async function getAllFromCollection(
  collectionName,
  fields = {},
  filter = {},
  page = "all",
  sort,
  limit = 24
) {
  const collection = db.collection(collectionName);
  if (sort === "cost-desc") sort = { price: -1 };
  else if (sort === "cost-asc") sort = { price: 1 };
  else if (sort === "created-at") sort = { "created-at": -1 };
  else if (sort === "rating") sort = { rating: -1 };
  else {
    sort = { popular: -1 };
  }
  count = await collection.countDocuments(filter);
  if (count === 0) {
    return [];
  }
  if (page === "all") {
    const cursor = collection.find(filter).project(fields).sort(sort);
    const result = await cursor.toArray();
    return { result: result, count: count };
  } else {
    const cursor = collection
      .find(filter, {
        limit: limit,
        skip: (Number(page) - 1) * limit,
        sort: sort,
      })
      .project(fields);
    const result = await cursor.toArray();
    return { result: result, count: count, pages: Math.ceil(count / limit) };
  }
}

async function getMultipleFromCollection(
  collectionName,
  fields = {},
  filter = {},
  limit = 10,
  offset = 0,
  sort = {}
) {
  const collection = db.collection(collectionName);
  const cursor = collection
    .find(filter)
    .project(fields)
    .limit(limit)
    .skip(offset)
    .sort(sort);
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

async function getOneFromCollectionByID(collectionName, id) {
  const collection = db.collection(collectionName);
  const data = collection.findById(id);
  return data;
}

async function insertOneData(collectionName, data) {
  const collection = db.collection(collectionName);
  const result = await collection.insertOne(data);
  const { insertedCount, insertedId } = result;
  return { insertedCount, insertedId };
}

async function insertManyData(collectionName, data) {
  const collection = db.collection(collectionName);
  const result = await collection.insertMany(data);
  return { insertedCount: result.insertedCount, insertedId: result.insertedId };
}

async function deleteOne(collectionName, filter = {}) {
  const collection = db.collection(collectionName);
  const result = await collection.deleteOne(filter);
  return result.deletedCount;
}

async function deleteMany(collectionName, filter = {}) {
  const collection = db.collection(collectionName);
  const result = await collection.deleteMany(filter);
  return result.deletedCount;
}

async function update(collectionName, update, filter = {}) {
  const collection = db.collection(collectionName);
  const result = await collection.updateMany(filter, update);
  return result.modifiedCount;
}

async function updateOne(collectionName, update, filter = {}) {
  const collection = db.collection(collectionName);
  const result = await collection.updateOne(filter, update, (upsert = true));
  return result.modifiedCount;
}

async function findOneAndReplace(collectionName, replace, filter = {}) {
  const collection = db.collection(collectionName);
  const result = await collection.findOneAndReplace(filter, replace);
  return result.modifiedCount;
}

async function findOneAndUpdate(collectionName, update, filter = {}) {
  const collection = db.collection(collectionName);
  const result = await collection.findOneAndUpdate(filter, update);
  return result.modifiedCount;
}

async function findOneAndDelete(collectionName, filter = {}) {
  const collection = db.collection(collectionName);
  const result = await collection.findOneAndDelete(filter);
  return result.modifiedCount;
}

async function findAndModify(
  collectionName,
  query,
  sort,
  update,
  options = {}
) {
  const collection = db.collection(collectionName);
  const result = await collection.findAndModify(query, sort, update, options);
  return result;
}

async function replaceOne(collectionName, replace, filter = {}) {
  const collection = db.collection(collectionName);
  const result = await collection.replaceOne(filter, replace);
  return result.modifiedCount;
}

async function getDistinct(collectionName, fieldName = "", filter = {}) {
  const collection = db.collection(collectionName);
  const result = collection.distinct(fieldName, filter);
  return result;
}

async function getCount(collectionName, filter = {}) {
  const collection = db.collection(collectionName);
  const result = collection.count(filter);
  return result;
}

async function getEstimatedDocumentCount(collectionName, filter = {}) {
  const collection = db.collection(collectionName);
  const result = collection.estimatedDocumentCount(filter);
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

async function bulkWrite(collectionName, operations, options = {}) {
  const collection = db.collection(collectionName);
  const result = await collection.bulkWrite(operations, options);
  return result;
}

//   Perform a geospatial query near a point (requires geospatial index).
async function geoNear(collectionName, coordinates, options = {}) {
  const collection = db.collection(collectionName);
  const data = await collection.geoNear(coordinates, options);
  return data;
}

// Perform a geo haystack search (requires a haystack index).
async function geoHaystackSearch(collectionName, x, y, options = {}) {
  const collection = db.collection(collectionName);
  const result = await collection.geoHaystackSearch(x, y, options);
  return result;
}

//Group documents in a collection (deprecated in favor of aggregation).
async function groupDocuments(
  collectionName,
  keys,
  condition,
  initial,
  reduce,
  finalize
) {
  const collection = db.collection(collectionName);
  const result = await collection.group(
    keys,
    condition,
    initial,
    reduce,
    finalize
  );
  return result;
}

//Get execution statistics for a query.
async function explainQuery(collectionName, filter = {}) {
  const collection = db.collection(collectionName);
  const explanation = await collection.find(filter).explain();
  return explanation;
}

// Uploading a file
async function uploadFile(filename, fileStream, options = {}) {
  const uploadStream = bucket.openUploadStream(filename, options);
  fileStream.pipe(uploadStream);
  return new Promise((resolve, reject) => {
    uploadStream.on("finish", () => resolve(uploadStream.id));
    uploadStream.on("error", reject);
  });
}
// Downloading a file
function downloadFile(fileId, destinationStream, options = {}) {
  const downloadStream = bucket.openDownloadStream(fileId, options);
  downloadStream.pipe(destinationStream);
  return new Promise((resolve, reject) => {
    downloadStream.on("end", resolve);
    downloadStream.on("error", reject);
  });
}

async function updateFullCollection(collectionName, data) {
  let responseMessage = ''
  try {
    const oldCollection = db.collection(collectionName); // Старая коллекция
    const newCollection = db.collection(`${collectionName}_new`); // Временная коллекция

    // Старт транзакции
    const session = client.startSession();
    session.startTransaction();
    try {
      let filteredData = data;
      if(collectionName==="stocks"){
        // Фильтруем данные
        filteredData = data.filter(
          (item) => item.branch_guid && item.product_guid
        );
      }
      // Добавляем только нужные документы в новую коллекцию
      if (filteredData.length > 0) {
        await newCollection.insertMany(filteredData, { session });
        console.log(
          `Inserted ${filteredData.length} documents into the new collection.`
        );
        responseMessage = `Inserted ${filteredData.length} documents into the new collection.`
      } else {
        // Удаляем старую коллекцию
        await newCollection.drop({ session });
        console.log("No valid data to insert into the new collection.");
        return {
          statusResponse: "error",
          error: "No valid data to insert into the new collection.",
        };
      }

      // Удаляем старую коллекцию
      await oldCollection.drop({ session });
      console.log("Old collection dropped.");

      // Переименовываем новую коллекцию
      await newCollection.rename(collectionName, { session });
      await newCollection.createIndex({ branch_guid: 1, product_guid: 1 }, { session });
      console.log("New collection renamed to 'stocks'.");

      // Подтверждаем транзакцию
      await session.commitTransaction();

      
    } catch (error) {
      session.abortTransaction();
    } finally {
      session.endSession();
      console.log("🚀 ~ updateFullCollection ~ responseMessage:", responseMessage)
      return ({ statusResponse: "success", message: responseMessage });
    }
  } catch (error) {
    console.error(error);
    return {
      statusResponse: "error",
      error: error,
    };
  }
}
module.exports = {
  connectDb,
  getDb: () => db,
  getBucket: () => bucket,
  getClient: () => client,
  getAllFromCollection,
  getOneFromCollectionByFilter,
  getOneFromCollectionByID,
  getDistinct,
  getMultipleFromCollection,
  getCount,
  getEstimatedDocumentCount,
  getObjectId,
  insertOneData,
  insertManyData,
  deleteOne,
  deleteMany,
  update,
  updateOne,
  aggregateCollection,
  findOneAndReplace,
  findOneAndUpdate,
  findOneAndDelete,
  findAndModify,
  replaceOne,
  bulkWrite,
  geoNear,
  geoHaystackSearch,
  groupDocuments,
  explainQuery,
  uploadFile,
  downloadFile,
  updateFullCollection,
};
