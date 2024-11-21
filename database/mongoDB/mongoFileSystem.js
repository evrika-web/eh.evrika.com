
const { GridFSBucket } = require("mongodb");

// Uploading a file
async function uploadFile(filename, fileStream, options = {}) {
    const bucket = new GridFSBucket(db);
  const uploadStream = bucket.openUploadStream(filename, options);
  fileStream.pipe(uploadStream);
  return new Promise((resolve, reject) => {
    uploadStream.on("finish", () => resolve(uploadStream.id));
    uploadStream.on("error", reject);
  });
}

// Usage:
// const fs = require('fs');
// const fileStream = fs.createReadStream('path/to/file');
// const fileId = await uploadFile('myfile.txt', fileStream);

//Upload a file and assign a custom _id to it.
async function uploadFileWithId(fileId, filename, fileStream, options = {}) {
    const bucket = new GridFSBucket(db);
  const uploadStream = bucket.openUploadStreamWithId(fileId, filename, options);
  fileStream.pipe(uploadStream);
  return new Promise((resolve, reject) => {
    uploadStream.on("finish", () => resolve(uploadStream.id));
    uploadStream.on("error", reject);
  });
}

// Downloading a file
function downloadFile(fileId, destinationStream, options = {}) {
    const bucket = new GridFSBucket(db);
  const downloadStream = bucket.openDownloadStream(fileId, options);
  downloadStream.pipe(destinationStream);
  return new Promise((resolve, reject) => {
    downloadStream.on("end", resolve);
    downloadStream.on("error", reject);
  });
}

function downloadFileByName(filename, destinationStream, options = {}) {
    const bucket = new GridFSBucket(db);
  const downloadStream = bucket.openDownloadStreamByName(filename, options);
  downloadStream.pipe(destinationStream);
  return new Promise((resolve, reject) => {
    downloadStream.on("end", resolve);
    downloadStream.on("error", reject);
  });
}

//Delete Document
async function deleteFile(fileId) {
    const bucket = new GridFSBucket(db);
  await bucket.delete(fileId);
}

async function renameFile(fileId, newFilename) {
    const bucket = new GridFSBucket(db);
  await bucket.rename(fileId, newFilename);
}

//Find Document
async function findFiles(filter = {}, options = {}) {
    const bucket = new GridFSBucket(db);
  const cursor = bucket.find(filter, options);
  const files = await cursor.toArray();
  return files;
}

async function listAllFiles() {
  return await findFiles();
}

async function getFileMetadata(fileId) {
  const files = await findFiles({ _id: fileId });
  return files.length > 0 ? files[0] : null;
}

function abortUpload(uploadStream) {
  return new Promise((resolve, reject) => {
    uploadStream.abort((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
//Usage
// const uploadStream = bucket.openUploadStream('myfile.txt');
// // ... some operations
// await abortUpload(uploadStream);

async function deleteAllFiles() {
    const bucket = new GridFSBucket(db);
  const files = await bucket.find().toArray();
  for (const file of files) {
    await bucket.delete(file._id);
  }
}

function uploadFileWithChunkSize(filename, fileStream, chunkSizeBytes) {
  const options = { chunkSizeBytes };
  return uploadFile(filename, fileStream, options);
}

function uploadFileWithMetadata(filename, fileStream, metadata = {}) {
  const options = { metadata };
  return uploadFile(filename, fileStream, options);
}

async function findFilesByMetadata(metadataQuery) {
    const bucket = new GridFSBucket(db);
  const cursor = bucket.find({ metadata: metadataQuery });
  const files = await cursor.toArray();
  return files;
}

async function countFiles(filter = {}) {
    const bucket = new GridFSBucket(db);
  const count = await bucket.find(filter).count();
  return count;
}

async function replaceFile(fileId, filename, newFileStream) {
  await deleteFile(fileId);
  return await uploadFileWithId(fileId, filename, newFileStream);
}
async function updateFileMetadata(fileId, newMetadata, db) {
  const collection = db.collection("fs.files");
  await collection.updateOne(
    { _id: fileId },
    { $set: { metadata: newMetadata } }
  );
}

async function deleteFilesByFilename(filename) {
  const files = await findFiles({ filename });
  for (const file of files) {
    await bucket.delete(file._id);
  }
}

module.exports = {
  uploadFile,
  uploadFileWithId,
  uploadFileWithChunkSize,
  uploadFileWithMetadata,
  updateFileMetadata,
  downloadFile,
  downloadFileByName,
  deleteFile,
  deleteAllFiles,
  deleteFilesByFilename,
  renameFile,
  findFiles,
  findFilesByMetadata,
  listAllFiles,
  getFileMetadata,
  abortUpload,
  countFiles,
  replaceFile,
};
