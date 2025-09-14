// db/generate.js
// Script to generate MongoDB collections and insert initial RBAC data

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rbac_demo';

// Define schemas
const roleSchema = new mongoose.Schema({ name: String, description: String });
const permissionSchema = new mongoose.Schema({ action: String, subject: String, fields: [String], conditions: Object });
const userSchema = new mongoose.Schema({ username: String, displayName: String });

const userRoleSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    roleId: mongoose.Schema.Types.ObjectId,
    username: String,
    roleName: String
});
const rolePermissionSchema = new mongoose.Schema({
    roleId: mongoose.Schema.Types.ObjectId,
    permissionId: mongoose.Schema.Types.ObjectId,
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

    // Insert roles
    const roles = await Role.insertMany([
        { name: 'Account Senior Manager', description: '' },
        { name: 'Account Junior Manager', description: '' },
        { name: 'Account Reporting', description: '' },
        { name: 'Account Operations', description: '' },
        { name: 'Company CEO', description: '' },
        { name: 'Account Intern', description: '' },
    ]);

    // Insert permissions
    const permissions = await Permission.insertMany([
        // Sales permissions
        { action: 'read', subject: 'sales' },
        { action: 'delete', subject: 'sales' },
        { action: 'update', subject: 'sales', fields: ['quantity'] },
        { action: 'create', subject: 'sales' },
        // Purchase permissions
        { action: 'read', subject: 'purchases' },
        { action: 'delete', subject: 'purchases' },
        { action: 'update', subject: 'purchases', fields: ['vendor'] },
        { action: 'update', subject: 'purchases', fields: ['description'] },
        { action: 'create', subject: 'purchases' },
        // Dashboard
        { action: 'read', subject: 'dashboard' },
    ]);

    // Insert users
    const users = await User.insertMany([
        { username: 'jackob', displayName: 'Account Senior Manager' },
        { username: 'pristinema', displayName: 'Account Junior Manager' },
        { username: 'teetsi', displayName: 'Account Reporting' },
        { username: 'daytona', displayName: 'Account Operations' },
        { username: 'sandeep', displayName: 'Company CEO' },
        { username: 'intern', displayName: 'Account Intern' },
    ]);


    // Map roles to users with username and roleName
    const userRoles = await UserRole.insertMany([
        { userId: users[0]._id, roleId: roles[0]._id, username: users[0].username, roleName: roles[0].name },
        { userId: users[1]._id, roleId: roles[1]._id, username: users[1].username, roleName: roles[1].name },
        { userId: users[2]._id, roleId: roles[2]._id, username: users[2].username, roleName: roles[2].name },
        { userId: users[3]._id, roleId: roles[3]._id, username: users[3].username, roleName: roles[3].name },
        { userId: users[4]._id, roleId: roles[4]._id, username: users[4].username, roleName: roles[4].name },
        { userId: users[5]._id, roleId: roles[5]._id, username: users[5].username, roleName: roles[5].name },
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
                roleId: roles[roleIdx]._id,
                permissionId: perm._id,
                roleName: roles[roleIdx].name,
                permissionName
            });
        }
    }

    console.log('Database seeded successfully.');
    await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
