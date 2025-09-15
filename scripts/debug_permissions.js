const mongoose = require('mongoose');
const path = require('path');
const { permittedFieldsOf } = require('@casl/ability/extra');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rbac_demo';

async function main() {
    await mongoose.connect(MONGO_URI);
    // load models
    require('../src/models/Role');
    require('../src/models/Permission');
    require('../src/models/User');
    require('../src/models/UserRole');
    require('../src/models/RolePermission');

    const User = mongoose.model('User');
    const user = await User.findOne({ username: 'jackob' });
    if (!user) {
        console.error('jackob not found');
        process.exit(1);
    }

    const { defineAbilityFor } = require('../src/middleware/casl');
    const ability = await defineAbilityFor({ id: user.id });
    console.log('Ability rules:');
    console.log(JSON.stringify(ability.rules, null, 2));

    try {
        const allowed = permittedFieldsOf(ability, 'purchases', { action: 'update' });
        console.log('permittedFieldsOf(update,purchases):', allowed);
    } catch (e) {
        console.error('permittedFieldsOf error:', e);
    }

    // test ForbiddenError
    const { ForbiddenError } = require('@casl/ability');
    try {
        ForbiddenError.from(ability).throwUnlessCan('update', 'purchases', ['vendor']);
        console.log('throwUnlessCan passed for update:purchases:vendor');
    } catch (e) {
        console.error('throwUnlessCan failed:', e.message);
    }

    await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
