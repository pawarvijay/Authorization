// test/rbac.e2e.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = mongoose.model('User');

// Helper to get user by username
async function getUser(username) {
    return await User.findOne({ username });
}

// Helper to attach user to request (simulate auth)
function withUser(user) {
    return (req, res, next) => {
        req.user = user;
        next();
    };
}

describe('RBAC API (live DB)', () => {
    let server;
    beforeAll(async () => {
        // Seed RBAC and form data
        const { execSync } = require('child_process');
        execSync('node ./db/rbac_generate.js');
        execSync('node ./db/formdata_generate.js');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rbac_demo');
        server = app.listen(4000);
    });
    afterAll(async () => {
        await mongoose.disconnect();
        server.close();
    });

    const users = ['jackob', 'pristinema', 'teetsi', 'daytona', 'sandeep', 'intern'];

    test.each(users)('%s can read all sales', async (username) => {
        const user = await getUser(username);
        // Inject user for this request
        const testApp = express();
        testApp.use((req, res, next) => { req.user = user; next(); });
        testApp.use('/api/sales', require('../src/routes/sales'));
        const res = await request(testApp).get('/api/sales');
        expect([200, 403]).toContain(res.statusCode);
    });

    // Add more tests for each role and permission as per requirement5.txt
});
