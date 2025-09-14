
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rbac_demo';

async function main() {
    await mongoose.connect(MONGO_URI);
    try {
        await mongoose.connection.dropDatabase();
        console.log('Database dropped.');
    } catch (err) {
        console.error('Failed to drop database:', err);
        process.exit(1);
    }
    await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
