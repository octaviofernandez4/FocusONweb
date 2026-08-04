const express = require('express');
const router = express.Router();

const {
    obtenerOrganizacionActual,
    actualizarOrganizacion,
    listarMiembros,
    eliminarMiembro,
    generarInvitacion,
    probarEmailNotificaciones,
    unirseAOrganizacion
} = require('../controllers/orgController');

const authMiddleware = require('../middlewares/authMiddleware');
const orgMiddleware = require('../middlewares/orgMiddleware');
const requireOrgAdmin = require('../middlewares/requireOrgAdmin');
const requireCompanyAccount = require('../middlewares/requireCompanyAccount');
const { validarOrganizacion } = require('../validators/orgValidator');

// --- RUTAS DE ORGANIZACIÓN ---

router.get('/me', authMiddleware, orgMiddleware, obtenerOrganizacionActual);
router.put('/me', authMiddleware, orgMiddleware, requireOrgAdmin, validarOrganizacion, actualizarOrganizacion);
router.get('/me/members', authMiddleware, orgMiddleware, listarMiembros);
router.delete('/me/members/:userId', authMiddleware, orgMiddleware, requireCompanyAccount, requireOrgAdmin, eliminarMiembro);
router.post('/me/invite', authMiddleware, orgMiddleware, requireCompanyAccount, requireOrgAdmin, generarInvitacion);
router.post('/me/test-email', authMiddleware, orgMiddleware, requireCompanyAccount, requireOrgAdmin, probarEmailNotificaciones);

// Unirse a una organización distinta mediante un link de invitación
router.post('/join/:token', authMiddleware, unirseAOrganizacion);

module.exports = router;
