// src/middleware/casl.js
const { ForbiddenError, AbilityBuilder, Ability } = require('@casl/ability');
const { permittedFieldsOf } = require('@casl/ability/extra');
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
            // Attach ability for route-level instance checks and for @casl/mongoose
            req.ability = ability;

            // Enforce that the user must have READ permission on the subject
            // before any other permission is evaluated. This centralizes the
            // requirement that all requests require read access by default.
            if (!ability.can('read', subject)) {
                return res.status(403).json({ error: 'Forbidden (read denied)' });
            }

            // If an array of fields is provided, ensure the ability permits all of them
            if (Array.isArray(fields) && fields.length > 0) {
                // Try permittedFieldsOf first
                let allowed = [];
                try {
                    allowed = permittedFieldsOf(ability, subject, { action });
                } catch (e) {
                    allowed = [];
                }

                // If permittedFieldsOf returned nothing, fall back to ability.rules
                if (!Array.isArray(allowed) || allowed.length === 0) {
                    const rules = ability.rules || [];
                    const matching = rules.filter(r => r.action === action && (r.subject === subject || r.subject === subject));
                    allowed = matching.reduce((acc, r) => {
                        if (Array.isArray(r.fields)) acc.push(...r.fields);
                        return acc;
                    }, []);
                }

                // De-duplicate allowed
                allowed = Array.from(new Set(allowed));

                // Ensure each requested field is allowed; use throwUnlessCan per-field (string)
                for (const f of fields) {
                    if (!allowed.includes(f)) {
                        try {
                            ForbiddenError.from(ability).throwUnlessCan(action, subject, f);
                        } catch (err) {
                            return res.status(403).json({ error: 'Forbidden (field access denied)', denied: f });
                        }
                    }
                }
            }

            // Finally check action-level permission on the subject.
            // If specific fields were requested we already validated each
            // field above; avoid calling throwUnlessCan with an array (it
            // expects a string). Only enforce the broad action when no
            // fields were supplied.
            if (!Array.isArray(fields) || fields.length === 0) {
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
