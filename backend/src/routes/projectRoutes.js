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
const { validarProyecto } = require('../validators/projectValidator');

// --- RUTAS DE PROYECTOS ---

router.get('/', authMiddleware, orgMiddleware, obtenerProyectos);
router.post('/', authMiddleware, orgMiddleware, validarProyecto, crearProyecto);
router.put('/:id', authMiddleware, orgMiddleware, validarProyecto, actualizarProyecto);
router.delete('/:id', authMiddleware, orgMiddleware, borrarProyecto);

module.exports = router;
