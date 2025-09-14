const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const salesSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4 },
    item: String,
    quantity: Number,
    price: Number,
    date: Date,
    size: String,
    color: String,
    brand: String
});

module.exports = mongoose.model('Sales', salesSchema);