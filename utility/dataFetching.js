const { default: axios } = require("axios");

async function dataFetching(url, customURL, configURL) {
  try {
    let backendUrl;
    let config;
    if (!customURL) {
      backendUrl = process.env.BACKEND_URL || "htts://evrika.com/api/v1";
      config = {
        headers: {
          Authorization: "Bearer " + process.env.BACKEND_TOKEN || "token-key",
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
        if (result.data.meta) {
          for (var i = 2; i <= result.data.meta.last_page; i++) {
            await axios(`${backendUrl}?page=${i}`, config)
              .then((result) => {
                data = data.concat(result.data.data);
              })
              .catch((err) => {
                console.error("[AXIOS]", err.message);
                throw new Error(err.message.toString());
              });
          }
        }
      })
      .catch((err) => {
        console.error("[AXIOS]", err.message);
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
