const express = require("express");
const { getHiddenFieldsObject } = require("../database/mongoDb/mongoFilter");
const {
  getAllFromCollection,
  deleteOne,
  getObjectId,
  updateOne,
  insertOneData,
  getOneFromCollectionByFilter,
} = require("../database/mongoDb/mongoQuerie");
const { authenticateToken } = require("../utility/authorization");
const moment = require("moment");

function getMongoApiRouter(
  singleRoute,
  multipleRoute,
  collectionName,
  hiddenCollectionFields = [],
  optionalParams = {}
) {
  const { singleDataFilter, additionalDataQuery, postBodyModifier, resultBodyModifier, singleResultBodyModifier } =
    optionalParams;
  const router = express.Router();
  router.get(multipleRoute + "/:page", async (req, res) => {
    const { page } = req.params;
    const query = req.query;
    try {
      let result = await getAllFromCollection(
        collectionName,
        getHiddenFieldsObject(hiddenCollectionFields),
        (filter = query.filter),
        page,
        (sort = query.sort || ""),
        (limit = parseInt(query.limit) || 24)
      );
      if (result) {
        if(resultBodyModifier && result.result.length !== 0){
          result = resultBodyModifier(result);
        }
        res.json(result);        
      } else {
        res.status(404).send({ error: "Not found" });
      }
    } catch (err) {
      console.log(err);
      res.status(404).send({ error: err.toString() });
    }
  });

  router.delete(singleRoute + "/:id", authenticateToken, async (req, res) => {
    let { id } = req.params;
    const filter = singleDataFilter
        ? singleDataFilter(id)
        : getObjectId(id);

    try {
      const result = await deleteOne(collectionName, { _id: filter });
      if (result === 0) {
        return res
          .status(404)
          .send({ error: "No item found with the given ID" });
      }
      res.json({ deletedCount: result });
    } catch (err) {
      console.log(err);
      res.status(500).send({ error: err.toString() });
    }
  });

  router.put(singleRoute + "/:id", async (req, res) => {
    let { id } = req.params;
    const filter = singleDataFilter
        ? singleDataFilter(id)
        : getObjectId(id);
    try {
      const result = await updateOne(
        collectionName,
        { $set: req.body.update },
        { _id: filter }
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
      if(collectionName ==='marketplace-reasons'){
        const filter = singleDataFilter(insertedData.vendor_code)
        let data = await getOneFromCollectionByFilter(collectionName, filter);
        if (data){
          data.reasons.push({reason: insertedData.reason, created_at: moment().format('YYYY-MM-DD HH:mm:ss')})
          const result = await updateOne(
            collectionName,
            { $set: data },
            { _id: insertedData.vendor_code}
          );
          res.json({ status: "success" });
        } else{
          insertedData._id = insertedData.vendor_code
          insertedData.reasons=[{reason: insertedData.reason, created_at: moment().format('YYYY-MM-DD HH:mm:ss')}]
          delete insertedData.reason
          const result = await insertOneData(collectionName, insertedData);
          res.json({ status: "success" });
        }
      } else{
        if (postBodyModifier) {
          insertedData = postBodyModifier(insertedData);
        }
        const result = await insertOneData(collectionName, insertedData);
        res.json({ result });
      }
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
      if (data) {
        if(singleResultBodyModifier){
          data = singleResultBodyModifier(data);
        } else {
          data = { result: data }
        }
        res.json(data);       
      } else {
        res.status(404).send({ error: "Not found" });
      }
    } catch (err) {
      console.log(err);
      res.status(404).send({ error: err.toString() });
    }
  });
  return router;
}

module.exports = getMongoApiRouter;
