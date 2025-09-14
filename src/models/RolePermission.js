const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema({
    roleId: String,
    permissionId: String,
    roleName: String,
    permissionName: String
});

module.exports = mongoose.model('RolePermission', rolePermissionSchema);