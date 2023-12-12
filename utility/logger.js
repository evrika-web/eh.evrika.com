function getLogFunction(...args) {
    return (...logArgs) => {
        console.log.apply(null, [...args.map(e => typeof e === 'function' ? e() : e), ...logArgs]);
    }
}

module.exports = getLogFunction;