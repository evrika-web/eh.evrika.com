const moment = require("moment");

function getTimeStamp(format = 'DD.MM.YYYY HH:mm:ss') {
    return function () {
        const date = moment().format(format);
        return date;
    }
}

function pipe(...fns) {
    console.log(fns)
    return (arg) => fns.reduce((a, x) => x(a), arg);
}

function getLogTag(tag) {
    return () => `[${tag}]`;
}

module.exports = {
    getTimeStamp,
    getLogTag,
    pipe
}