module.exports = {
    "up": "CREATE TABLE promotions (promotion_id INT NOT NULL AUTO_INCREMENT, UNIQUE KEY promotion_id (promotion_id), doc_number TEXT, type TINYTEXT, start_date DATETIME, end_date DATETIME, percents JSON, products JSON, participate BOOLEAN )",
    "down": "DROP TABLE promotions"
}