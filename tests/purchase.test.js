
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
        // Tests seed RBAC data and ensure required permissions for the test user
        execSync('node ./dbseeding/rbac_generate.js');
        execSync('node ./dbseeding/formdata_generate.js');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rbac_demo');
        // Fetch a real user from the seeded DB and attach its id for tests
        const User = mongoose.model('User');
        const user = await User.findOne({ username: 'jackob' });
        if (user) testUser = { id: user.id };
        // Ensure this role has create permissions for tests (allow creating via API)
        const RolePermission = mongoose.model('RolePermission');
        const roleId = 'r-11111111-1111-1111-1111-111111111111';
        const permsToEnsure = ['p-00000004-0000-0000-0000-000000000004', 'p-00000009-0000-0000-0000-000000000009'];
        for (const pid of permsToEnsure) {
            const exists = await RolePermission.findOne({ roleId, permissionId: pid });
            if (!exists) {
                await RolePermission.create({ roleId, permissionId: pid, roleName: 'Account Senior Manager', permissionName: `create:${pid}` });
            }
        }
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
        // Server may return the pre-update document if `new: false` is used.
        // Fetch the purchase to verify the vendor was updated. Some routes
        // return the pre-update document; if GET by id returns 404, scan list.
        let getRes = await request(app).get(`/api/purchase/${purchasedId}`);
        if (getRes.statusCode === 404) {
            const all = await request(app).get('/api/purchase');
            expect(all.statusCode).toBe(200);
            const found = all.body.find(p => p.id === purchasedId);
            expect(found).toBeTruthy();
            expect(found.vendor).toBe('UpdatedVendor');
        } else {
            expect(getRes.statusCode).toBe(200);
            expect(getRes.body.vendor).toBe('UpdatedVendor');
        }
    });
});
