const request = require('supertest');
const express = require('express');
const app = express();
app.use(express.json());
const purchaseRoutes = require('../src/routes/purchase');
let testUser = null;
app.use((req, res, next) => { req.user = testUser; next(); });
app.use('/api/purchase', purchaseRoutes);

const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rbac_demo');
    const User = mongoose.model('User');
    const user = await User.findOne({ username: 'jackob' });
    if (!user) { console.error('jackob not found'); process.exit(1); }
    testUser = { id: user.id };

    // create
    const createRes = await request(app).post('/api/purchase').send({ item: 'itemC', quantity: 1, price: 20, vendor: 'OriginalVendor', date: new Date(), size: 'S', paymentStatus: 'Paid', deliveryStatus: 'Delivered' });
    console.log('create status', createRes.status, createRes.body);
    const id = createRes.body.id;

    // patch
    const patchRes = await request(app).patch(`/api/purchase/${id}/vendor`).send({ vendor: 'UpdatedVendor' });
    console.log('patch status', patchRes.status, patchRes.body.text || patchRes.body || patchRes.body);

    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
