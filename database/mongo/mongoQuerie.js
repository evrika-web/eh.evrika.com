const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Автоматически require всех моделей из папки models
const modelsPath = path.join(__dirname, 'models');
fs.readdirSync(modelsPath).forEach(file => {
  if (file.endsWith('.js')) {
    require(path.join(modelsPath, file));
  }
});

let bucket = null;

async function connectDb(url, dbName) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(url, {
        dbName,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      // GridFSBucket для файлов
      bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db);
      return true;
    }
  } catch (err) {
    throw err;
  }
  return false;
}

function getBucket() {
  return bucket;
}

function getClient() {
  return mongoose.connection.getClient();
}

function getDb() {
  return mongoose.connection.db;
}

// Универсальный getter для моделей
function getModel(collectionName) {
  if (mongoose.models[collectionName]) {
    return mongoose.model(collectionName);
  }
  // Пустая схема, если не определена явно
  return mongoose.model(
    collectionName,
    new mongoose.Schema({}, { strict: false }),
    collectionName
  );
}

// Универсальные CRUD-функции

async function getAllFromCollection(
  collectionName,
  fields = {},
  filter = {},
  page = "all",
  sort,
  limit = 24
) {
  const Model = getModel(collectionName);
  let sortObj = {};
  if (sort === "cost-desc") sortObj = { price: -1 };
  else if (sort === "cost-asc") sortObj = { price: 1 };
  else if (sort === "created-at") sortObj = { "created-at": -1 };
  else if (sort === "rating") sortObj = { rating: -1 };
  else sortObj = { popular: -1 };

  const count = await Model.countDocuments(filter);
  if (count === 0) return [];

  let query = Model.find(filter, fields).sort(sortObj);
  if (page !== "all") {
    query = query.skip((Number(page) - 1) * limit).limit(limit);
    const result = await query.exec();
    return { result, count, pages: Math.ceil(count / limit) };
  } else {
    const result = await query.exec();
    return { result, count };
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
  const Model = getModel(collectionName);
  const result = await Model.find(filter, fields)
    .sort(sort)
    .skip(offset)
    .limit(limit)
    .exec();
  return result;
}

async function getOneFromCollectionByFilter(collectionName, filter = {}) {
  const Model = getModel(collectionName);
  return await Model.findOne(filter).exec();
}

async function getOneFromCollectionByID(collectionName, id) {
  const Model = getModel(collectionName);
  return await Model.findById(id).exec();
}

async function insertOneData(collectionName, data) {
  const Model = getModel(collectionName);
  const doc = await Model.create(data);
  return { insertedCount: 1, insertedId: doc._id };
}

async function insertManyData(collectionName, data) {
  const Model = getModel(collectionName);
  const docs = await Model.insertMany(data);
  return { insertedCount: docs.length, insertedId: docs.map(d => d._id) };
}

async function deleteOne(collectionName, filter = {}) {
  const Model = getModel(collectionName);
  const result = await Model.deleteOne(filter);
  return result.deletedCount;
}

async function deleteMany(collectionName, filter = {}) {
  const Model = getModel(collectionName);
  const result = await Model.deleteMany(filter);
  return result.deletedCount;
}

async function update(collectionName, update, filter = {}) {
  const Model = getModel(collectionName);
  const result = await Model.updateMany(filter, update);
  return result.modifiedCount;
}

async function updateOne(collectionName, update, filter = {}) {
  const Model = getModel(collectionName);
  const result = await Model.updateOne(filter, update, { upsert: true });
  return result.modifiedCount;
}

async function findOneAndReplace(collectionName, replace, filter = {}) {
  const Model = getModel(collectionName);
  const result = await Model.findOneAndReplace(filter, replace);
  return result ? 1 : 0;
}

async function findOneAndUpdate(collectionName, update, filter = {}) {
  const Model = getModel(collectionName);
  const result = await Model.findOneAndUpdate(filter, update);
  return result ? 1 : 0;
}

async function findOneAndDelete(collectionName, filter = {}) {
  const Model = getModel(collectionName);
  const result = await Model.findOneAndDelete(filter);
  return result ? 1 : 0;
}

async function findAndModify(
  collectionName,
  query,
  sort,
  update,
  options = {}
) {
  const Model = getModel(collectionName);
  // findOneAndUpdate с опциями
  return await Model.findOneAndUpdate(query, update, { sort, ...options });
}

async function replaceOne(collectionName, replace, filter = {}) {
  const Model = getModel(collectionName);
  const result = await Model.replaceOne(filter, replace);
  return result.modifiedCount;
}

async function getDistinct(collectionName, fieldName = "", filter = {}) {
  const Model = getModel(collectionName);
  return await Model.distinct(fieldName, filter);
}

async function getCount(collectionName, filter = {}) {
  const Model = getModel(collectionName);
  return await Model.countDocuments(filter);
}

async function getEstimatedDocumentCount(collectionName) {
  const Model = getModel(collectionName);
  return await Model.estimatedDocumentCount();
}

function getObjectId(id) {
  return new mongoose.Types.ObjectId(id);
}

async function aggregateCollection(collectionName, aggregate = []) {
  const Model = getModel(collectionName);
  return await Model.aggregate(aggregate);
}

async function bulkWrite(collectionName, operations, options = {}) {
  const Model = getModel(collectionName);
  return await Model.bulkWrite(operations, options);
}

// GridFS (upload/download) — оставляем через bucket
async function uploadFile(filename, fileStream, options = {}) {
  const uploadStream = bucket.openUploadStream(filename, options);
  fileStream.pipe(uploadStream);
  return new Promise((resolve, reject) => {
    uploadStream.on("finish", () => resolve(uploadStream.id));
    uploadStream.on("error", reject);
  });
}

function downloadFile(fileId, destinationStream, options = {}) {
  const downloadStream = bucket.openDownloadStream(fileId, options);
  downloadStream.pipe(destinationStream);
  return new Promise((resolve, reject) => {
    downloadStream.on("end", resolve);
    downloadStream.on("error", reject);
  });
}

// Остальные специфические функции (гео, group, explain) — через aggregate или не поддерживаются напрямую Mongoose
async function geoNear(collectionName, coordinates, options = {}) {
  const Model = getModel(collectionName);
  // Используйте aggregate с $geoNear
  const pipeline = [
    {
      $geoNear: {
        near: { type: "Point", coordinates },
        distanceField: "dist.calculated",
        ...options,
      },
    },
  ];
  return await Model.aggregate(pipeline);
}

async function geoHaystackSearch() {
  throw new Error("geoHaystackSearch не поддерживается в Mongoose.");
}

async function groupDocuments() {
  throw new Error("groupDocuments устарел и не поддерживается в Mongoose.");
}

async function explainQuery(collectionName, filter = {}) {
  const Model = getModel(collectionName);
  // Mongoose не поддерживает .explain напрямую, используйте .find().explain() через native
  return await Model.find(filter).explain();
}

// Транзакции и updateFullCollection — пример через native session
async function updateFullCollection(collectionName, data) {
  let responseMessage = '';
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const Model = getModel(collectionName);
    const NewModel = getModel(`${collectionName}_new`);

    let filteredData = data;
    if (collectionName === "stocks") {
      filteredData = data.filter(
        (item) => item.branch_guid && item.product_guid
      );
    }

    if (!Array.isArray(filteredData) || filteredData.length === 0) {
      return {
        statusResponse: "error",
        error: "No valid data to insert into the new collection.",
      };
    }

    await NewModel.insertMany(filteredData, { session });
    responseMessage = `Inserted ${filteredData.length} documents into the new collection.`;

    await session.commitTransaction();

    // Drop и rename вне транзакции
    await Model.collection.drop();
    await NewModel.collection.rename(collectionName);

    // Индексы только после переименования
    if (collectionName === "stocks") {
      await Model.collection.createIndex({ branch_guid: 1, product_guid: 1 });
    } else if (collectionName === "costs") {
      await Model.collection.createIndex({ product: 1, product_code: 1 });
    }

    return { statusResponse: "success", message: responseMessage };
  } catch (error) {
    try {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
    } catch (abortError) {}
    return {
      statusResponse: "error",
      error: error.message,
    };
  } finally {
    session.endSession();
  }
}

module.exports = {
  connectDb,
  getDb,
  getBucket,
  getClient,
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
