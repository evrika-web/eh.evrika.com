const mongoose = require('mongoose');

const surveysDataSchema = new mongoose.Schema({
  question: { type: String, required: false },
  answerType: { type: String, required: false },
  answer: { type: mongoose.Schema.Types.Mixed, required: false }
}, { _id: false });

const surveysSchema = new mongoose.Schema({
  id: { type: String, required: false },
  surveyName: { type: String, required: false },
  surveyData: { type: [surveysDataSchema], required: false }
}, { collection: 'surveys' });

module.exports = mongoose.model('Surveys', surveysSchema);