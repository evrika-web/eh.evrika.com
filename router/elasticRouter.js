const express = require("express");
const { fullIndexing, deleteIndex } = require("../database/elastic/elasticSync");
const router = express.Router();

router.get("/fullindexing", async (req, res) => {
  try {
    const result = await fullIndexing();
    res.json({
      result: "Полная индексация завершена",
    });
  } catch (err) {
    logger.error(`Ошибка при полной индексации: ${err}`);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

router.get("/deleteIndex", async (req, res) => {
    try {
      const result = await deleteIndex();
      res.json({
        result: "Индексация удалена",
      });
    } catch (err) {
      logger.error(`Ошибка при удалении индексации: ${err}`);
      res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
  });

module.exports = router;
