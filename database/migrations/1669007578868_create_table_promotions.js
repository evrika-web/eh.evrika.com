module.exports = {
    "up": "CREATE TABLE promotions (promotion_id INT NOT NULL, UNIQUE KEY promotion_id (promotion_id), doc_number TINYTEXT, type TINYTEXT, start_date DATETIME, end_date DATETIME, percents JSON, products JSON, participate BOOLEAN )",
    "down": "DROP TABLE promotions"
}