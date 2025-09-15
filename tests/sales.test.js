
const request = require('supertest');
// Increase default Jest timeout for slow DB seed operations
jest.setTimeout(30000);
const express = require('express');
const salesRoutes = require('../src/routes/sales');
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
app.use('/api/sales', salesRoutes);


describe('Sales API', () => {
    beforeAll(async () => {
        // Seed RBAC and form data
        // Tests seed RBAC data and adjust role-permissions when necessary so
        // the test user can exercise API endpoints under test.
        execSync('node ./dbseeding/rbac_generate.js');
        execSync('node ./dbseeding/formdata_generate.js');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rbac_demo');
        const User = mongoose.model('User');
        const user = await User.findOne({ username: 'jackob' });
        if (user) testUser = { id: user.id };
        // Ensure this role has create permissions for tests
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
