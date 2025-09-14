const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    id: String,
    name: String,
    description: String
});

module.exports = mongoose.model('Role', roleSchema);