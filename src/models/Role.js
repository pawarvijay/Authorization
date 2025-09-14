const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: String,
    description: String
});

module.exports = mongoose.model('Role', roleSchema);