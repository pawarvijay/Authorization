
const request = require('supertest');
const express = require('express');
const salesRoutes = require('../src/routes/sales');
const mongoose = require('mongoose');
const { execSync } = require('child_process');

const app = express();
app.use(express.json());
// Inject a user with all permissions for test
app.use((req, res, next) => {
    req.user = { _id: 'testuserid' };
    next();
});
app.use('/api/sales', salesRoutes);


describe('Sales API', () => {
    beforeAll(async () => {
        // Seed RBAC and form data
        execSync('node ./db/rbac_generate.js');
        execSync('node ./db/formdata_generate.js');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rbac_demo');
    });
    afterAll(async () => {
        await mongoose.disconnect();
    });

    it('should create a sale', async () => {
        const res = await request(app)
            .post('/api/sales')
            .send({ item: 'item1', quantity: 10, price: 100, date: new Date(), size: 'M', color: 'Red', brand: 'BrandA' });
        expect(res.statusCode).toBe(201);
        expect(res.body.item).toBe('item1');
        expect(typeof res.body.id).toBe('string');
    });

    it('should get all sales', async () => {
        await request(app).post('/api/sales').send({ item: 'item2', quantity: 5, price: 200, date: new Date(), size: 'L', color: 'Blue', brand: 'BrandB' });
        const res = await request(app).get('/api/sales');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        if (res.body.length > 0) {
            expect(typeof res.body[0].id).toBe('string');
        }
    });
});
