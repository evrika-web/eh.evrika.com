async function createIndex(collectionName, indexSpec, options = {}) {
    const collection = db.collection(collectionName);
    const result = await collection.createIndex(indexSpec, options);
    return result;
  }

async function listIndexes(collectionName) {
    const collection = db.collection(collectionName);
    const indexes = await collection.listIndexes().toArray();
    return indexes;
  }
    
  async function dropIndex(collectionName, indexName) {
    const collection = db.collection(collectionName);
    const result = await collection.dropIndex(indexName);
    return result;
  }

  async function indexInformation(collectionName, options = {}) {
    const collection = db.collection(collectionName);
    const info = await collection.indexInformation(options);
    return info;
  }  

  async function createCollection(collectionName, options = {}) {
    const result = await db.createCollection(collectionName, options);
    return result;
  }
  
  async function renameCollection(oldName, newName, options = {}) {
    const result = await db.renameCollection(oldName, newName, options);
    return result;
  }

  async function dropCollection(collectionName) {
    const result = await db.dropCollection(collectionName);
    return result;
  }
  async function listCollections() {
    const collections = await db.listCollections().toArray();
    return collections;
  }

  //Watch for changes in a collection.
  function watchCollection(collectionName, pipeline = [], options = {}) {
    const collection = db.collection(collectionName);
    const changeStream = collection.watch(pipeline, options);
    return changeStream;
  }

  //Watch for changes in the database.
  function watchDatabase(pipeline = [], options = {}) {
    const changeStream = db.watch(pipeline, options);
    return changeStream;
  }
  
  //Perform map-reduce operations on a collection.
  async function mapReduce(collectionName, mapFunction, reduceFunction, options = {}) {
    const collection = db.collection(collectionName);
    const result = await collection.mapReduce(mapFunction, reduceFunction, options);
    return result;
  }

  //Get statistics about a collection.
  async function getCollectionStats(collectionName) {
    const collection = db.collection(collectionName);
    const stats = await collection.stats();
    return stats;
  }  

  // Add a user to the database.
  async function addUser(username, password, options = {}) {
    const result = await db.addUser(username, password, options);
    return result;
  }

  //Remove a user from the database.
  async function removeUser(username) {
    const result = await db.removeUser(username);
    return result;
  }

  //List all databases (requires admin privileges).
  async function listDatabases() {
    const adminDb = db.admin();
    const result = await adminDb.listDatabases();
    return result;
  }
  
  
module.exports = {
    createIndex,
    listIndexes,
    dropIndex,
    createCollection,
    renameCollection,
    dropCollection,
    listCollections,
    watchCollection,
    watchDatabase,
    mapReduce,
    getCollectionStats,
    indexInformation,
    addUser,
    removeUser,
    listDatabases,
  };