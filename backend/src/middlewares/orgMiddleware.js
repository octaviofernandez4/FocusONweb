const User = require('../models/User');

// Adjunta la organización activa del usuario autenticado (req.orgId)
const orgMiddleware = async (req, res, next) => {
    try {
        const usuario = await User.findById(req.user.id).select('currentOrg');

        if (!usuario || !usuario.currentOrg) {
            return res.status(409).json({ mensaje: 'El usuario no pertenece a ninguna organización' });
        }

        req.orgId = usuario.currentOrg;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al resolver la organización del usuario' });
    }
};

module.exports = orgMiddleware;
