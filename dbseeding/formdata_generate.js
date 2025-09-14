// db/formdata_generate.js
// Script to create and populate sales and purchases collections with mock data

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rbac_demo';

const salesSchema = new mongoose.Schema({
    id: String,
    item: String,
    quantity: Number,
    price: Number,
    date: Date,
    size: String,
    color: String,
    brand: String
});

const purchasesSchema = new mongoose.Schema({
    id: String,
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
        { id: 'd3b07384-d9f6-4a9d-9a3b-1c2e3f4a5b6c', item: 'Laptop', quantity: 2, price: 1200, date: new Date('2025-09-01'), size: '15 inch', color: 'Silver', brand: 'Dell' },
        { id: 'a2c5e6f7-1234-4bcd-9ef0-111213141516', item: 'Phone', quantity: 5, price: 800, date: new Date('2025-09-02'), size: '6 inch', color: 'Black', brand: 'Samsung' },
        { id: 'b4f6d8a0-2345-4ef1-8c2b-212223242526', item: 'Monitor', quantity: 3, price: 300, date: new Date('2025-09-03'), size: '24 inch', color: 'White', brand: 'LG' },
        { id: 'c7e8f9a1-3456-4abc-9d3e-313233343536', item: 'Keyboard', quantity: 10, price: 50, date: new Date('2025-09-04'), size: 'Full', color: 'Black', brand: 'Logitech' },
        { id: 'd9a0b1c2-4567-4def-8f4a-414243444546', item: 'Mouse', quantity: 8, price: 25, date: new Date('2025-09-05'), size: 'Medium', color: 'Gray', brand: 'HP' }
    ];

    const purchasesData = [
        { id: 'e1f2a3b4-5678-4abc-9a5b-515253545556', item: 'Printer', quantity: 2, price: 200, vendor: 'OfficeDepot', date: new Date('2025-09-01'), size: 'Large', paymentStatus: 'Paid', deliveryStatus: 'Delivered' },
        { id: 'f2e3d4c5-6789-4bcd-8b6c-616263646566', item: 'Desk', quantity: 4, price: 150, vendor: 'Ikea', date: new Date('2025-09-02'), size: 'Medium', paymentStatus: 'Pending', deliveryStatus: 'Shipped' },
        { id: 'a3b4c5d6-7890-4cde-9d7e-717273747576', item: 'Chair', quantity: 6, price: 75, vendor: 'Staples', date: new Date('2025-09-03'), size: 'Standard', paymentStatus: 'Paid', deliveryStatus: 'Delivered' },
        { id: 'b4c5d6e7-8901-4def-8e8f-818283848586', item: 'Router', quantity: 1, price: 120, vendor: 'Amazon', date: new Date('2025-09-04'), size: 'Small', paymentStatus: 'Paid', deliveryStatus: 'Processing' },
        { id: 'c5d6e7f8-9012-4fab-9f9a-919293949596', item: 'Projector', quantity: 2, price: 500, vendor: 'BestBuy', date: new Date('2025-09-05'), size: 'Large', paymentStatus: 'Pending', deliveryStatus: 'Pending' }
    ];

    await Sales.insertMany(salesData);
    await Purchases.insertMany(purchasesData);

    console.log('Sales and Purchases collections created and populated.');
    await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
