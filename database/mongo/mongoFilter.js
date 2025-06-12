function getHiddenFieldsObject(fields = []){
    const hidden = {};
    for (let field of fields) {
            hidden[field] = 0;
    }
    return hidden;
}

module.exports = {
    getHiddenFieldsObject,
};