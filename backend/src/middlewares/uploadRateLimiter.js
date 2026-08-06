const rateLimit = require('express-rate-limit');

// Sin esto, cualquier cuenta autenticada podría saturar la cuota de
// almacenamiento/ancho de banda de Cloudinary subiendo archivos sin freno.
// 60 cada 15 min está bien por encima de adjuntar varios archivos a una tarea.
const uploadRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: { mensaje: 'Demasiados archivos subidos. Probá de nuevo en unos minutos.' }
});

module.exports = uploadRateLimiter;
