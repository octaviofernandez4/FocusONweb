const express = require('express');
const router = express.Router();

// Importamos todas las funciones del controlador
const {
    crearTarea,
    obtenerTareas,
    obtenerEstadisticasTareas,
    actualizarTarea,
    borrarTarea
} = require('../controllers/taskController');

// Middleware de autenticación: Verifica que el usuario tenga un JWT válido [cite: 145]
const authMiddleware = require('../middlewares/authMiddleware');

// Middleware de organización: resuelve la organización activa del usuario
const orgMiddleware = require('../middlewares/orgMiddleware');
const requireCompanyAccount = require('../middlewares/requireCompanyAccount');

// Validador de tareas: Asegura que el título y la descripción no estén vacíos [cite: 92-94]
const { validarTarea } = require('../validators/taskValidator');

// --- RUTAS DE TAREAS ---
// Importante: las rutas estáticas (/stats) van ANTES de /:id

// Ruta para crear (POST): solo cuenta empresa puede asignar tareas nuevas
router.post('/', authMiddleware, orgMiddleware, requireCompanyAccount, validarTarea, crearTarea);

// Ruta para leer (GET): Devuelve las tareas de toda la organización del usuario autenticado [cite: 156-157]
router.get('/', authMiddleware, orgMiddleware, obtenerTareas);

// Estadísticas de tareas (para la vista de Completadas)
router.get('/stats', authMiddleware, orgMiddleware, obtenerEstadisticasTareas);

// Ruta para actualizar (PUT): Valida los campos antes de aplicar los cambios [cite: 162-163]
router.put('/:id', authMiddleware, orgMiddleware, validarTarea, actualizarTarea);

// Ruta para borrar (DELETE): Solo quien creó la tarea o un admin de la organización
router.delete('/:id', authMiddleware, orgMiddleware, borrarTarea);

module.exports = router;
