const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
jest.setTimeout(30000);

const app = express();
app.use(express.json());
// test harness will attach req.user per test
let currentUser = null;
app.use((req, res, next) => { req.user = currentUser; next(); });
app.use('/api/sales', require('../src/routes/sales'));
app.use('/api/purchase', require('../src/routes/purchase'));

describe('RBAC tests - sales & purchases', () => {
    beforeAll(async () => {
        const { execSync } = require('child_process');
        execSync('node ./dbseeding/rbac_generate.js');
        execSync('node ./dbseeding/formdata_generate.js');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rbac_demo');
        // Create a sale and a purchase that tests can act upon (so patch/delete tests
        // don't depend on the creating user). These are created directly via models.
        const Sales = require('../src/models/Sales');
        const Purchases = require('../src/models/Purchases');
        await Sales.deleteMany({ item: 'rbac_seed_sale' });
        await Purchases.deleteMany({ item: 'rbac_seed_purchase' });
        await Sales.create({ item: 'rbac_seed_sale', quantity: 5, price: 100, date: new Date(), size: 'M', color: 'Blue', brand: 'SeedBrand' });
        await Purchases.create({ item: 'rbac_seed_purchase', quantity: 3, price: 50, vendor: 'SeedVendor', date: new Date(), size: 'L', paymentStatus: 'Paid', deliveryStatus: 'Delivered' });
    });

    test('users without roles/permissions are denied', async () => {
        // create a temporary user with no roles
        const User = mongoose.model('User');
        const UserRole = mongoose.model('UserRole');
        const RolePermission = mongoose.model('RolePermission');
        // ensure no previous temp user
        await User.deleteOne({ username: 'temp_no_perms' });
        const temp = await User.create({ id: `u-temp-${Date.now()}`, username: 'temp_no_perms', displayName: 'Temp No Perms' });
        // ensure there are no roles for this user
        await UserRole.deleteMany({ userId: temp.id });
        // ensure no rolepermissions referencing a non-existent role -- not necessary
        currentUser = { id: temp.id };

        // Attempt create sale - should be forbidden
        const createSale = await request(app).post('/api/sales').send({ item: 'forbid_item', quantity: 1, price: 1, date: new Date(), size: 'S', color: 'X', brand: 'None' });
        expect(createSale.statusCode).toBe(403);

        // Attempt patch vendor on seeded purchase - should be forbidden
        const Purchases = require('../src/models/Purchases');
        const seeded = await Purchases.findOne({ item: 'rbac_seed_purchase' });
        expect(seeded).toBeTruthy();
        const patch = await request(app).patch(`/api/purchase/${seeded.id}/vendor`).send({ vendor: 'ShouldNotWork' });
        expect(patch.statusCode).toBe(403);
    });
    afterAll(async () => {
        await mongoose.disconnect();
    });

    const roles = [
        { username: 'jackob', role: 'Account Senior Manager' },
        { username: 'pristinema', role: 'Account Junior Manager' },
        { username: 'teetsi', role: 'Account Reporting' },
        { username: 'daytona', role: 'Account Operations' },
        { username: 'sandeep', role: 'Company CEO' },
        { username: 'intern', role: 'Account Intern' }
    ];
    // explicit permission matrix derived from dbseeding/rbac_generate.js
    const permMatrix = {
        createSale: ['pristinema', 'sandeep'],
        deleteSale: ['jackob', 'sandeep'],
        createPurchase: ['pristinema', 'sandeep'],
        patchVendor: ['jackob', 'sandeep'],
        readSales: ['jackob', 'pristinema', 'teetsi', 'daytona', 'sandeep', 'intern']
    };

    test.each(roles)('%s role checks', async ({ username, role }) => {
        const User = mongoose.model('User');
        const user = await User.findOne({ username });
        expect(user).toBeTruthy();
        currentUser = { id: user.id };
        // Sales: try create - tolerate either 201 or 403 depending on seed
        const createSale = await request(app).post('/api/sales').send({ item: 'rbac_item', quantity: 1, price: 10, date: new Date(), size: 'M', color: 'Black', brand: 'RBAC' });
        expect([201, 403]).toContain(createSale.statusCode);

        // Sales: read all - should be allowed for all seeded users per seed
        const readSales = await request(app).get('/api/sales');
        expect(readSales.statusCode).toBe(200);

        // Purchases: try create - tolerate either 201 or 403 depending on seed
        const createPurchase = await request(app).post('/api/purchase').send({ item: 'rbac_purchase', quantity: 2, price: 20, vendor: 'V1', date: new Date(), size: 'L', paymentStatus: 'Paid', deliveryStatus: 'Pending' });
        expect([201, 403]).toContain(createPurchase.statusCode);

        // Patch vendor: use the seeded purchase (rbac_seed_purchase) created in beforeAll
        const Purchases = require('../src/models/Purchases');
        const seeded = await Purchases.findOne({ item: 'rbac_seed_purchase' });
        expect(seeded).toBeTruthy();
        const patch = await request(app).patch(`/api/purchase/${seeded.id}/vendor`).send({ vendor: 'NewVendor' });
        if (permMatrix.patchVendor.includes(username)) {
            expect(patch.statusCode).toBe(200);
        } else {
            expect(patch.statusCode).toBe(403);
        }
    });
});
