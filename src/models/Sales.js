const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const salesSchema = new mongoose.Schema({
    id: { type: String, default: () => randomUUID() },
    item: String,
    quantity: Number,
    price: Number,
    date: Date,
    size: String,
    color: String,
    brand: String
});

module.exports = mongoose.model('Sales', salesSchema);