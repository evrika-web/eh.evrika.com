const getLogFunction = require("./logger");
const { getLogTag, getTimeStamp } = require("./logUtils");

function getAppLog(tag) {
    return getLogFunction(getLogTag(tag), getTimeStamp());
}

module.exports = {
    getAppLog,
}