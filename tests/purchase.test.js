
const request = require('supertest');
const express = require('express');
const purchaseRoutes = require('../src/routes/purchase');
const mongoose = require('mongoose');
const { execSync } = require('child_process');

const app = express();
app.use(express.json());
// Inject a user with all permissions for test
app.use((req, res, next) => {
    req.user = { _id: 'testuserid' };
    next();
});
app.use('/api/purchase', purchaseRoutes);


describe('Purchase API', () => {
    beforeAll(async () => {
        // Seed RBAC and form data
        execSync('node ./db/rbac_generate.js');
        execSync('node ./db/formdata_generate.js');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rbac_demo');
    });
    afterAll(async () => {
        await mongoose.disconnect();
    });

    it('should create a purchase', async () => {
        const res = await request(app)
            .post('/api/purchase')
            .send({ item: 'itemA', quantity: 2, price: 50, vendor: 'VendorA', date: new Date(), size: 'S', paymentStatus: 'Paid', deliveryStatus: 'Delivered' });
        expect(res.statusCode).toBe(201);
        expect(res.body.item).toBe('itemA');
        expect(typeof res.body.id).toBe('string');
    });

    it('should get all purchases', async () => {
        await request(app).post('/api/purchase').send({ item: 'itemB', quantity: 3, price: 75, vendor: 'VendorB', date: new Date(), size: 'M', paymentStatus: 'Pending', deliveryStatus: 'Shipped' });
        const res = await request(app).get('/api/purchase');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        if (res.body.length > 0) {
            expect(typeof res.body[0].id).toBe('string');
        }
    });
});
