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

// defineAbilityFor: build user's Ability from persisted RolePermission data.
// Notes:
// - Uses `user.id` (string GUID) as the canonical user identifier.
// - Permissions are stored with string `id` fields in the seed data.
// - No global test-mode bypass is used; tests should seed the required permissions.
async function defineAbilityFor(user) {
    // Use `user.id` (string GUID) everywhere
    const uid = user && user.id;
    if (!uid) {
        throw new Error('User id missing - expected user.id (string)');
    }
    const userRoles = await UserRole.find({ userId: uid });
    const roleIds = userRoles.map(ur => ur.roleId);
    const rolePerms = await RolePermission.find({ roleId: { $in: roleIds } });
    const permIds = rolePerms.map(rp => rp.permissionId);
    // Permissions now use string `id` field in seed data
    const permissions = await Permission.find({ id: { $in: permIds } });
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
            // Enforce that the user must have READ permission on the subject
            // before any other permission is evaluated. This centralizes the
            // requirement that all requests require read access by default.
            if (!ability.can('read', subject)) {
                return res.status(403).json({ error: 'Forbidden (read denied)' });
            }
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
