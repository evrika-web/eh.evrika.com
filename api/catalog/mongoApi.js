const express = require("express");
const { getHiddenFieldsObject } = require("../../database/mongoDb/mongoFilter");
const {
  getAllFromCollection,
  deleteOne,
  getObjectId,
  updateOne,
  insertOneData,
  getOneFromCollectionByFilter,
} = require("../../database/mongoDb/mongoQuerie");
const dataMatching = require("../../utility/dataMatching");

function getMongoApiRouter(
  singleRoute,
  multipleRoute,
  collectionName,
  hiddenCollectionFields = [],
  optionalParams = {}
) {
  const { singleDataFilter, additionalDataQuery, postBodyModifier } =
    optionalParams;
  const router = express.Router();
  router.get(multipleRoute + "/:page", async (req, res) => {
    const { page } = req.params;
    const filter = req.query;
    try {
      const result = await getAllFromCollection(
        collectionName,
        getHiddenFieldsObject(hiddenCollectionFields),
        filter,
        page
      );
      res.json(result);
    } catch (err) {
      console.log(err);
      res.status(404).send({ error: err.toString() });
    }
  });

  router.delete(singleRoute + "/:id", async (req, res) => {
    let { id } = req.params;
    if(collectionName==='products'){
        id=parseInt(id)
    }else{
        id=getObjectId(id)
    }
    try {
      const result = await deleteOne(collectionName, { _id: id });
      res.json({ deletedCount: result });
    } catch (err) {
      console.log(err);
      res.status(500).send({ error: err.toString() });
    }
  });

  router.put(singleRoute + "/:id", async (req, res) => {
    let { id } = req.params;
    if(collectionName==='products'){
        id=parseInt(id)
    }else{
        id=getObjectId(id)
    }
    try {
      const result = await updateOne(
        collectionName,
        { $set: req.body.update },
        { _id: parseInt(id) }
      );
      res.json({ updateCount: result });
    } catch (err) {
      console.log(err);
      res.status(500).send({ error: err.toString() });
    }
  });

  router.post(singleRoute, async (req, res) => {
    try {
      let insertedData = req.body;
      if (postBodyModifier) {
        insertedData = postBodyModifier(insertedData);
      }
      if (collectionName==='products' && insertedData.id) {
        insertedData._id = insertedData.id;
      }
      const result = await insertOneData(collectionName, insertedData);
      res.json({ result });
    } catch (err) {
      console.log(err);
      res.status(500).send({ error: err.toString() });
    }
  });

  router.get(singleRoute + "/:param", async (req, res) => {
    const { param } = req.params;
    try {
      const filter = singleDataFilter
        ? singleDataFilter(param)
        : { url: "/" + param };
      let data = await getOneFromCollectionByFilter(collectionName, filter);
      if (additionalDataQuery) {
        data = {
          ...data,
          additionalData: await additionalDataQuery(),
        };
      }
      res.json({ result: data });
    } catch (err) {
      console.log(err);
      res.status(404).send({ error: err.toString() });
    }
  });
  return router;
}

module.exports = getMongoApiRouter;
