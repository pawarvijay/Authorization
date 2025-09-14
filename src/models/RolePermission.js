const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema({
    roleId: mongoose.Schema.Types.ObjectId,
    permissionId: mongoose.Schema.Types.ObjectId,
    roleName: String,
    permissionName: String
});

module.exports = mongoose.model('RolePermission', rolePermissionSchema);