const express = require('express');
const router = express.Router();

const {
    obtenerProyectos,
    crearProyecto,
    actualizarProyecto,
    borrarProyecto
} = require('../controllers/projectController');

const authMiddleware = require('../middlewares/authMiddleware');
const orgMiddleware = require('../middlewares/orgMiddleware');
const requireCompanyAccount = require('../middlewares/requireCompanyAccount');
const { validarProyecto } = require('../validators/projectValidator');

// --- RUTAS DE PROYECTOS ---

router.get('/', authMiddleware, orgMiddleware, obtenerProyectos);
// Solo cuenta empresa crea proyectos — un empleado no tiene por qué organizar
// la estructura de proyectos de la organización.
router.post('/', authMiddleware, orgMiddleware, requireCompanyAccount, validarProyecto, crearProyecto);
router.put('/:id', authMiddleware, orgMiddleware, validarProyecto, actualizarProyecto);
router.delete('/:id', authMiddleware, orgMiddleware, borrarProyecto);

module.exports = router;
