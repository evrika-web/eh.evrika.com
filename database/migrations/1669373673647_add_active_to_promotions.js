module.exports = {
    "up": "ALTER TABLE promotions ADD active BOOL;",
    "down": "ALTER TABLE promotions DROP COLUMN active;"
}