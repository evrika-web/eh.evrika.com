const express = require("express");
const router = express.Router();
const moment = require("moment");
require("dotenv").config();
const SimpleNodeLogger = require("simple-node-logger");
const { ObjectId } = require("mongodb");
const { uploadFile, downloadFile } = require("../database/mongoDb/mongoQuerie");
const { authenticateToken } = require("../utility/authorization");

opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-file-system-binary.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

router.post("/upload", authenticateToken,(req, res) => {
  const filename = req.headers["file-name"];
  const fileStream = req;
  uploadFile(filename, fileStream)
    .then((fileId) => {
      res.status(200).send({ fileId });
    })
    .catch((error) => {
        log.error("Error in uploading file ", {
            error: error
          });
      res.status(500).send(error.message);
    });
});

router.get("/download/:id", authenticateToken,(req, res) => {
  const fileId = new ObjectId(req.params.id);
  downloadFile(fileId, res)
    .then(() => {
      // Download completed
    })
    .catch((error) => {
        log.error("Error in downloading file ", {
            error: error
          });
      res.status(404).send("File not found");
    });
});

module.exports = router;
