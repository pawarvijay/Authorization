
const request = require('supertest');
// Increase default Jest timeout for slow DB seed operations
jest.setTimeout(30000);
const express = require('express');
const purchaseRoutes = require('../src/routes/purchase');
const mongoose = require('mongoose');
const { execSync } = require('child_process');

const app = express();
app.use(express.json());
// Attach test user (will be populated in beforeAll)
let testUser = null;
app.use((req, res, next) => {
    req.user = testUser;
    next();
});
app.use('/api/purchase', purchaseRoutes);


describe('Purchase API', () => {
    beforeAll(async () => {
        // Seed RBAC and form data
        execSync('node ./dbseeding/rbac_generate.js');
        execSync('node ./dbseeding/formdata_generate.js');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rbac_demo');
        // Fetch a real user from the seeded DB and attach its id for tests
        const User = mongoose.model('User');
        const user = await User.findOne({ username: 'jackob' });
        if (user) testUser = { id: user.id };
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

    it('jackob can update vendor of a purchase', async () => {
        // Create a purchase first
        const createRes = await request(app).post('/api/purchase').send({ item: 'itemC', quantity: 1, price: 20, vendor: 'OriginalVendor', date: new Date(), size: 'S', paymentStatus: 'Paid', deliveryStatus: 'Delivered' });
        expect(createRes.statusCode).toBe(201);
        const purchasedId = createRes.body.id;

        // Patch vendor
        const patchRes = await request(app).patch(`/api/purchase/${purchasedId}/vendor`).send({ vendor: 'UpdatedVendor' });
        expect(patchRes.statusCode).toBe(200);
        expect(patchRes.body.vendor).toBe('UpdatedVendor');
    });
});
