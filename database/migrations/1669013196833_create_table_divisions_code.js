module.exports = {
    "up": "CREATE TABLE divisions_code (id INT NOT NULL, UNIQUE KEY id (id), code TINYTEXT, site_id TINYTEXT, name TEXT)",
    "down": "DROP TABLE divisions_code"
}