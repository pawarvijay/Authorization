const mongoose = require('mongoose');

const userRoleSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    roleId: mongoose.Schema.Types.ObjectId,
    username: String,
    roleName: String
});

module.exports = mongoose.model('UserRole', userRoleSchema);