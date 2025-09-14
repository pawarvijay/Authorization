const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const purchasesSchema = new mongoose.Schema({
    id: { type: String, default: () => randomUUID() },
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