const mongoose = require('mongoose');

const userRoleSchema = new mongoose.Schema({
    userId: String,
    roleId: String,
    username: String,
    roleName: String
});

module.exports = mongoose.model('UserRole', userRoleSchema);