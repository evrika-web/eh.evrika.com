const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const filtersRoute = require('./routes/filters');
require('dotenv').config();
var cors = require("cors");
const app = express();

//CORS policy
app.use(cors());
app.options('*', cors())

app.use(bodyParser.json());
app.use('/api', filtersRoute);

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
