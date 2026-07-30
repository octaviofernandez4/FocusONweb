const multer = require('multer');

// Guardamos el archivo en memoria (buffer) para subirlo directo a Cloudinary,
// sin escribirlo nunca en disco del servidor.
const storage = multer.memoryStorage();

const TIPOS_PERMITIDOS = ['image/png', 'image/jpeg', 'application/pdf'];

const fileFilter = (req, file, cb) => {
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
        return cb(new Error('Solo se permiten archivos PNG, JPG o PDF'));
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB, igual que el límite mostrado en el modal
});

module.exports = upload;
