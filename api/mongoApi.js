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
const { maskPhoneNumber } = require("../utility/maskData");
const { authenticateToken } = require("../utility/authorization");

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
    const query = req.query;
    try {
      const result = await getAllFromCollection(
        collectionName,
        getHiddenFieldsObject(hiddenCollectionFields),
        (filter = query.filter),
        page,
        (sort = query.sort || ""),
        (limit = parseInt(query.limit) || 24)
      );
      if (result) {
        if (
          (multipleRoute === "/promo_forms_galmart" ||
            multipleRoute === "/promo_forms_cfo") &&
          result.result.length !== 0
        ) {
          maskedResult = result.result.map((e) => ({
            ...e,
            phone: maskPhoneNumber(e.phone),
          }));
          res.json({ result: maskedResult, count: result.count });
        } else {
          res.json(result);
        }
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
    // Determine the type of id based on the collection
    if (collectionName === "products") {
      id = parseInt(id);
    } else {
      id = getObjectId(id);
    }

    try {
      const result = await deleteOne(collectionName, { _id: id });
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
    if (collectionName === "products") {
      id = parseInt(id);
    } else {
      id = getObjectId(id);
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
      if (collectionName === "products" && insertedData.id) {
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
      if (data) {
        if (collectionName === "promocodes") res.json(data);
        else {
          res.json({ result: data });
        }
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
