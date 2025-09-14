// db/generate.js
// Script to generate MongoDB collections and insert initial RBAC data

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rbac_demo';

// Define schemas (use string GUID ids for cross-references)
const roleSchema = new mongoose.Schema({ id: String, name: String, description: String });
const permissionSchema = new mongoose.Schema({ id: String, action: String, subject: String, fields: [String], conditions: Object });
const userSchema = new mongoose.Schema({ id: String, username: String, displayName: String });

const userRoleSchema = new mongoose.Schema({
    userId: String,
    roleId: String,
    username: String,
    roleName: String
});
const rolePermissionSchema = new mongoose.Schema({
    roleId: String,
    permissionId: String,
    roleName: String,
    permissionName: String
});

const Role = mongoose.model('Role', roleSchema);
const Permission = mongoose.model('Permission', permissionSchema);
const User = mongoose.model('User', userSchema);
const UserRole = mongoose.model('UserRole', userRoleSchema);
const RolePermission = mongoose.model('RolePermission', rolePermissionSchema);

async function main() {
    await mongoose.connect(MONGO_URI);
    await Role.deleteMany({});
    await Permission.deleteMany({});
    await User.deleteMany({});
    await UserRole.deleteMany({});
    await RolePermission.deleteMany({});

    // Insert roles (hardcoded GUID ids)
    const roles = await Role.insertMany([
        { id: 'r-11111111-1111-1111-1111-111111111111', name: 'Account Senior Manager', description: '' },
        { id: 'r-22222222-2222-2222-2222-222222222222', name: 'Account Junior Manager', description: '' },
        { id: 'r-33333333-3333-3333-3333-333333333333', name: 'Account Reporting', description: '' },
        { id: 'r-44444444-4444-4444-4444-444444444444', name: 'Account Operations', description: '' },
        { id: 'r-55555555-5555-5555-5555-555555555555', name: 'Company CEO', description: '' },
        { id: 'r-66666666-6666-6666-6666-666666666666', name: 'Account Intern', description: '' },
    ]);

    // Insert permissions
    const permissions = await Permission.insertMany([
        // Sales permissions
        { id: 'p-00000001-0000-0000-0000-000000000001', action: 'read', subject: 'sales' },
        { id: 'p-00000002-0000-0000-0000-000000000002', action: 'delete', subject: 'sales' },
        { id: 'p-00000003-0000-0000-0000-000000000003', action: 'update', subject: 'sales', fields: ['quantity'] },
        { id: 'p-00000004-0000-0000-0000-000000000004', action: 'create', subject: 'sales' },
        // Purchase permissions
        { id: 'p-00000005-0000-0000-0000-000000000005', action: 'read', subject: 'purchases' },
        { id: 'p-00000006-0000-0000-0000-000000000006', action: 'delete', subject: 'purchases' },
        { id: 'p-00000007-0000-0000-0000-000000000007', action: 'update', subject: 'purchases', fields: ['vendor'] },
        { id: 'p-00000008-0000-0000-0000-000000000008', action: 'update', subject: 'purchases', fields: ['description'] },
        { id: 'p-00000009-0000-0000-0000-000000000009', action: 'create', subject: 'purchases' },
        // Dashboard
        { id: 'p-00000010-0000-0000-0000-000000000010', action: 'read', subject: 'dashboard' },
    ]);

    // Insert users (with GUID ids)
    const users = await User.insertMany([
        { id: 'u-11111111-1111-1111-1111-111111111111', username: 'jackob', displayName: 'Account Senior Manager' },
        { id: 'u-22222222-2222-2222-2222-222222222222', username: 'pristinema', displayName: 'Account Junior Manager' },
        { id: 'u-33333333-3333-3333-3333-333333333333', username: 'teetsi', displayName: 'Account Reporting' },
        { id: 'u-44444444-4444-4444-4444-444444444444', username: 'daytona', displayName: 'Account Operations' },
        { id: 'u-55555555-5555-5555-5555-555555555555', username: 'sandeep', displayName: 'Company CEO' },
        { id: 'u-66666666-6666-6666-6666-666666666666', username: 'intern', displayName: 'Account Intern' },
    ]);


    // Map roles to users with username and roleName
    const userRoles = await UserRole.insertMany([
        { userId: users[0].id, roleId: roles[0].id, username: users[0].username, roleName: roles[0].name },
        { userId: users[1].id, roleId: roles[1].id, username: users[1].username, roleName: roles[1].name },
        { userId: users[2].id, roleId: roles[2].id, username: users[2].username, roleName: roles[2].name },
        { userId: users[3].id, roleId: roles[3].id, username: users[3].username, roleName: roles[3].name },
        { userId: users[4].id, roleId: roles[4].id, username: users[4].username, roleName: roles[4].name },
        { userId: users[5].id, roleId: roles[5].id, username: users[5].username, roleName: roles[5].name },
    ]);


    // Map permissions to roles with roleName and permissionName
    const rolePermMap = [
        // Account Senior Manager - jackob
        [0, [0, 1, 4, 5, 6]],
        // Account Junior Manager - pristinema
        [1, [0, 2, 3, 4, 7, 8]],
        // Account Reporting - teetsi
        [2, [0, 4]],
        // Account Operations - daytona
        [3, [0, 2, 4, 7]],
        // Company CEO - sandeep
        [4, [9, 0, 1, 2, 3, 4, 5, 6, 7, 8]],
        // Account Intern - intern
        [5, [0, 4, 2, 7]],
    ];
    for (const [roleIdx, permIdxs] of rolePermMap) {
        for (const permIdx of permIdxs) {
            const perm = permissions[permIdx];
            let permissionName = perm.action + ':' + perm.subject;
            if (perm.fields && perm.fields.length > 0) {
                permissionName += ':' + perm.fields.join(',');
            }
            await RolePermission.create({
                roleId: roles[roleIdx].id,
                permissionId: perm.id,
                roleName: roles[roleIdx].name,
                permissionName
            });
        }
    }

    console.log('Database seeded successfully.');
    await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
