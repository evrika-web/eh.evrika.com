// controllers/stockController.js
const Stock = require('../models/stock');

async function getStockWithDetails(req, res) {
    try {
        const stocks = await Stock.find()
            .populate('productKey')  // Виртуальное поле product, чтобы подтянуть данные из Product
            .populate('branchKey')   // Виртуальное поле branch, чтобы подтянуть данные из Branch
            .exec();

        res.status(200).json(stocks);
    } catch (error) {
        console.error('Error fetching stocks with details:', error);
        res.status(500).json({ error: 'Error fetching stocks with details' });
    }
}

module.exports = { getStockWithDetails };
