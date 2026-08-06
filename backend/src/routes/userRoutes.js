const express = require('express');
const router = express.Router();

// Importamos las funciones del controlador de usuarios [cite: 152, 154]
const { crearUsuario, loginUsuario, obtenerPerfil, actualizarPerfil, cambiarContrasena, solicitarResetContrasena, resetearContrasena, descartarNotificacion } = require('../controllers/userController');

// Importamos los validadores para asegurar que los datos sean correctos [cite: 81, 87]
const { validarRegistro, validarLogin, validarActualizacionPerfil, validarCambioContrasena, validarSolicitarReset, validarResetContrasena, validarDescartarNotificacion } = require('../validators/userValidator');

const authMiddleware = require('../middlewares/authMiddleware');
const authRateLimiter = require('../middlewares/authRateLimiter');
const accountRateLimiter = require('../middlewares/accountRateLimiter');

// --- RUTAS DE AUTENTICACIÓN ---

// Ruta para Registrarse (POST a /api/register)
// Primero valida los campos y luego crea el usuario
router.post('/register', authRateLimiter, validarRegistro, crearUsuario);

// Ruta para Iniciar Sesión (POST a /api/login) [cite: 153]
// Primero valida los campos y luego genera el token JWT
router.post('/login', authRateLimiter, accountRateLimiter, validarLogin, loginUsuario);

// Recuperar contraseña sin sesión iniciada — pedir el link y después usarlo.
router.post('/forgot-password', authRateLimiter, validarSolicitarReset, solicitarResetContrasena);
router.post('/reset-password/:token', authRateLimiter, validarResetContrasena, resetearContrasena);

// --- RUTAS DE PERFIL ---

router.get('/me', authMiddleware, obtenerPerfil);
router.put('/me', authMiddleware, validarActualizacionPerfil, actualizarPerfil);
router.put('/me/password', authMiddleware, authRateLimiter, validarCambioContrasena, cambiarContrasena);

// Descartar (ocultar para siempre) una notificación derivada de una tarea.
router.patch('/me/notifications/dismiss', authMiddleware, validarDescartarNotificacion, descartarNotificacion);

module.exports = router;