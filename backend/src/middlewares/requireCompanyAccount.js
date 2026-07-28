const User = require('../models/User');

// Solo las cuentas "empresa" pueden invitar gente, crear proyectos o crear tareas.
// A diferencia de requireOrgAdmin (que mira el rol dentro de Membership),
// esto mira el tipo de cuenta real del usuario — necesario porque un
// "empleado" que se registró sin invitación igual termina siendo admin
// de su propia organización placeholder, pero no por eso debe tener esos permisos.
const requireCompanyAccount = async (req, res, next) => {
    try {
        const usuario = await User.findById(req.user.id).select('accountType');

        if (!usuario || usuario.accountType !== 'empresa') {
            return res.status(403).json({ mensaje: 'Solo una cuenta de empresa puede hacer esto' });
        }

        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al verificar el tipo de cuenta' });
    }
};

module.exports = requireCompanyAccount;
