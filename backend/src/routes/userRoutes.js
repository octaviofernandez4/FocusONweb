const express = require('express');
const router = express.Router();

// Importamos las funciones del controlador de usuarios [cite: 152, 154]
const { crearUsuario, loginUsuario, obtenerPerfil, actualizarPerfil } = require('../controllers/userController');

// Importamos los validadores para asegurar que los datos sean correctos [cite: 81, 87]
const { validarRegistro, validarLogin, validarActualizacionPerfil } = require('../validators/userValidator');

const authMiddleware = require('../middlewares/authMiddleware');

// --- RUTAS DE AUTENTICACIÓN ---

// Ruta para Registrarse (POST a /api/register)
// Primero valida los campos y luego crea el usuario
router.post('/register', validarRegistro, crearUsuario);

// Ruta para Iniciar Sesión (POST a /api/login) [cite: 153]
// Primero valida los campos y luego genera el token JWT
router.post('/login', validarLogin, loginUsuario);

// --- RUTAS DE PERFIL ---

router.get('/me', authMiddleware, obtenerPerfil);
router.put('/me', authMiddleware, validarActualizacionPerfil, actualizarPerfil);

module.exports = router;