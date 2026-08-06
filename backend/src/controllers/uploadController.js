const cloudinary = require('../config/cloudinary');
const { detalleError } = require('../utils/errorResponse');

// Sube un archivo (imagen o PDF) a Cloudinary y devuelve su metadata para
// guardarla en el array `attachments` de una tarea.
const subirArchivo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ mensaje: 'No se envió ningún archivo' });
        }

        const resultado = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'focusonweb/attachments', resource_type: 'auto' },
                (error, result) => (error ? reject(error) : resolve(result))
            );
            stream.end(req.file.buffer);
        });

        res.status(201).json({
            name: req.file.originalname,
            url: resultado.secure_url,
            size: req.file.size,
            type: req.file.mimetype
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al subir el archivo', error: detalleError(error) });
    }
};

module.exports = { subirArchivo };
