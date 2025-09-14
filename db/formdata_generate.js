// db/formdata_generate.js
// Script to create and populate sales and purchases collections with mock data

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rbac_demo';

const salesSchema = new mongoose.Schema({
    id: Number,
    item: String,
    quantity: Number,
    price: Number,
    date: Date,
    size: String,
    color: String,
    brand: String
});

const purchasesSchema = new mongoose.Schema({
    id: Number,
    item: String,
    quantity: Number,
    price: Number,
    vendor: String,
    date: Date,
    size: String,
    paymentStatus: String,
    deliveryStatus: String
});

const Sales = mongoose.model('Sales', salesSchema);
const Purchases = mongoose.model('Purchases', purchasesSchema);

async function main() {
    await mongoose.connect(MONGO_URI);
    await Sales.deleteMany({});
    await Purchases.deleteMany({});

    const salesData = [
        { id: 1, item: 'Laptop', quantity: 2, price: 1200, date: new Date('2025-09-01'), size: '15 inch', color: 'Silver', brand: 'Dell' },
        { id: 2, item: 'Phone', quantity: 5, price: 800, date: new Date('2025-09-02'), size: '6 inch', color: 'Black', brand: 'Samsung' },
        { id: 3, item: 'Monitor', quantity: 3, price: 300, date: new Date('2025-09-03'), size: '24 inch', color: 'White', brand: 'LG' },
        { id: 4, item: 'Keyboard', quantity: 10, price: 50, date: new Date('2025-09-04'), size: 'Full', color: 'Black', brand: 'Logitech' },
        { id: 5, item: 'Mouse', quantity: 8, price: 25, date: new Date('2025-09-05'), size: 'Medium', color: 'Gray', brand: 'HP' }
    ];

    const purchasesData = [
        { id: 1, item: 'Printer', quantity: 2, price: 200, vendor: 'OfficeDepot', date: new Date('2025-09-01'), size: 'Large', paymentStatus: 'Paid', deliveryStatus: 'Delivered' },
        { id: 2, item: 'Desk', quantity: 4, price: 150, vendor: 'Ikea', date: new Date('2025-09-02'), size: 'Medium', paymentStatus: 'Pending', deliveryStatus: 'Shipped' },
        { id: 3, item: 'Chair', quantity: 6, price: 75, vendor: 'Staples', date: new Date('2025-09-03'), size: 'Standard', paymentStatus: 'Paid', deliveryStatus: 'Delivered' },
        { id: 4, item: 'Router', quantity: 1, price: 120, vendor: 'Amazon', date: new Date('2025-09-04'), size: 'Small', paymentStatus: 'Paid', deliveryStatus: 'Processing' },
        { id: 5, item: 'Projector', quantity: 2, price: 500, vendor: 'BestBuy', date: new Date('2025-09-05'), size: 'Large', paymentStatus: 'Pending', deliveryStatus: 'Pending' }
    ];

    await Sales.insertMany(salesData);
    await Purchases.insertMany(purchasesData);

    console.log('Sales and Purchases collections created and populated.');
    await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
