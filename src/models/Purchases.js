const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const purchasesSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4 },
    item: String,
    quantity: Number,
    price: Number,
    vendor: String,
    date: Date,
    size: String,
    paymentStatus: String,
    deliveryStatus: String
});

module.exports = mongoose.model('Purchases', purchasesSchema);