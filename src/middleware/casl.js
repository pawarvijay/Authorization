// src/middleware/casl.js
const { ForbiddenError, AbilityBuilder, Ability } = require('@casl/ability');
const mongoose = require('mongoose');
require('../models/Role');
require('../models/Permission');
require('../models/User');
require('../models/UserRole');
require('../models/RolePermission');
const Role = mongoose.model('Role');
const Permission = mongoose.model('Permission');
const UserRole = mongoose.model('UserRole');
const RolePermission = mongoose.model('RolePermission');
const User = mongoose.model('User');

async function defineAbilityFor(user) {
    const userRoles = await UserRole.find({ userId: user._id });
    const roleIds = userRoles.map(ur => ur.roleId);
    const rolePerms = await RolePermission.find({ roleId: { $in: roleIds } });
    const permIds = rolePerms.map(rp => rp.permissionId);
    const permissions = await Permission.find({ _id: { $in: permIds } });
    const { can, cannot, build } = new AbilityBuilder(Ability);
    permissions.forEach(perm => {
        if (perm.fields && perm.fields.length > 0) {
            can(perm.action, perm.subject, perm.fields);
        } else {
            can(perm.action, perm.subject);
        }
    });
    return build();
}

function caslMiddleware(action, subject, fields) {
    return async function (req, res, next) {
        try {
            const user = req.user; // Assume user is attached to req
            if (!user) return res.status(401).json({ error: 'Unauthorized' });
            const ability = await defineAbilityFor(user);
            if (fields) {
                ForbiddenError.from(ability).throwUnlessCan(action, subject, fields);
            } else {
                ForbiddenError.from(ability).throwUnlessCan(action, subject);
            }
            next();
        } catch (err) {
            if (err instanceof ForbiddenError) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            next(err);
        }
    };
}

module.exports = { caslMiddleware, defineAbilityFor };
