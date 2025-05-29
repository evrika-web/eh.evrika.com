const axios = require('axios');
const { MongoClient } = require('mongodb');
const schedule = require('node-schedule');
const axiosRetry  = require('axios-retry').default;
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URL;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;
const API_URL = process.env.BACKEND_URL;
const BACKEND_TOKEN = process.env.BACKEND_TOKEN;

const client = new MongoClient(MONGO_URI);

axiosRetry(axios, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay
});

async function fetchDataAndStore() {
    console.log('Function fetchDataAndStore started');
    try {
        await client.connect();
        const db = client.db(MONGO_DB_NAME);
        const tempCollection = db.collection('productsTemp');

        console.log('Clearing temporary collection productsTemp...');
        await tempCollection.deleteMany({});

        const firstPageResponse = await axios.get(`${API_URL}/mongo/products?page=1`, {
            headers: { 'Accept-Encoding': 'gzip', 'Authorization':`Bearer ${BACKEND_TOKEN}`,'Content-Type':"*" }
        });
        const totalPages = firstPageResponse.data.meta.last_page;
        let dataBuffer = [];

        const requests = [];
        for (let page = 1; page <= totalPages; page++) {
            requests.push(axios.get(`${API_URL}/mongo/products?page=${page}`, {
                headers: { 'Accept-Encoding': 'gzip', 'Authorization':`Bearer ${BACKEND_TOKEN}`,'Content-Type':"*" }
            }));
        }

        const responses = await Promise.all(requests);
        responses.forEach(response => {
            dataBuffer = dataBuffer.concat(response.data.data);
        });

        console.log('Inserting all data into temporary collection...');
        await tempCollection.insertMany(dataBuffer);

        if (dataBuffer.length > 0) {
            console.log('Replacing old collection with the new data...');
            const oldCollection = db.collection('products');
            await oldCollection.drop();
            await tempCollection.rename('products');
            console.log('Data successfully stored in MongoDB with collection replaced.');
        } else {
            console.log('No data imported. Old collection not modified.');
        }
    } catch (error) {
        console.error('Error fetching or storing data:', error);
        return error
    } finally {
        console.log('Closing MongoDB connection.');
        await client.close();
        return 'ok'
    }
}

schedule.scheduleJob('0 0 1 * *', async () => {
    console.log('Running monthly data sync...');
    await fetchDataAndStore();
});

console.log('Monthly data sync service initialized.');

module.exports = {
    fetchDataAndStore,
  };