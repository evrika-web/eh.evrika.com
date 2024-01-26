const { default: axios } = require("axios");
//add logger
const SimpleNodeLogger = require("simple-node-logger");
const moment = require("moment");
opts = {
  logFilePath: `logs/${moment().format("DD-MM-YYYY")}-data-fetching.log`,
  timestampFormat: "DD-MM-YYYY HH:mm:ss.SSS",
};
const log = SimpleNodeLogger.createSimpleLogger(opts);

async function dataFetching(url, customURL, configURL) {
  try {
    let backendUrl;
    let config;
    if (!customURL) {
      backendUrl = process.env.BACKEND_URL || "htts://evrika.com/api/v1";
      config = {
        headers: {
          Authorization: "Bearer " + process.env.BACKEND_TOKEN || "token-key",
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept-Encoding": "*",
        },
      };
      backendUrl += url;
    } else {
      backendUrl = url;
      config = configURL;
    }
    let data;
    await axios(`${backendUrl}`, config)
      .then(async (result) => {
        data = result.data.data;
        log.info("[SUCCESS] ", data);
        if (result.data.meta) {
          for (var i = 2; i <= result.data.meta.last_page; i++) {
            await axios(`${backendUrl}?page=${i}`, config)
              .then((result) => {
                data = data.concat(result.data.data);
                log.info("[SUCCESS] ", data);
              })
              .catch((err) => {
                log.error("[URL] ", backendUrl);
                log.error("[AXIOS] ", err);
                console.error("[AXIOS] ", err);
                throw new Error(err.message.toString());
              });
          }
        }
      })
      .catch((err) => {
        log.error("[URL] ", backendUrl);
        log.error("[AXIOS] ", err);
        console.error("[AXIOS] ", err);
        throw new Error(err.message.toString());
      });
    return { data: data, status: 200 };
  } catch (err) {
    console.log("CATCH: " + err);
    return { err: err.toString(), status: 500 };
  }
}

module.exports = {
  dataFetching,
};
