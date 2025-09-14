const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    action: String,
    subject: String,
    fields: [String],
    conditions: Object
});

module.exports = mongoose.model('Permission', permissionSchema);