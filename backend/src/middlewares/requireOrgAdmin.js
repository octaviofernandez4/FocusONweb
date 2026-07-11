const Membership = require('../models/Membership');

// Requiere que el usuario autenticado sea admin de la organización activa (req.orgId)
const requireOrgAdmin = async (req, res, next) => {
    try {
        const membresia = await Membership.findOne({ org: req.orgId, user: req.user.id });

        if (!membresia || membresia.role !== 'admin') {
            return res.status(403).json({ mensaje: 'Acción reservada a administradores de la organización' });
        }

        req.membership = membresia;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al verificar permisos de administrador' });
    }
};

module.exports = requireOrgAdmin;
