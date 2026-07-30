const express = require('express');
const router = express.Router();

const { subirArchivo } = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// POST /api/uploads — sube un archivo (PNG/JPG/PDF, hasta 10MB) a Cloudinary.
// El error de multer (tipo/tamaño inválido) se atrapa acá para devolver un 400 claro
// en vez de que caiga en el manejador de errores genérico (500).
router.post('/', authMiddleware, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ mensaje: err.message || 'Error al subir el archivo' });
        }
        next();
    });
}, subirArchivo);

module.exports = router;
