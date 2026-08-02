const rateLimit = require('express-rate-limit');

// Frena intentos de fuerza bruta contra login/registro — 20 intentos cada 15
// minutos por IP. Solo en estas dos rutas: el resto de la API (leer/actualizar
// tareas, etc.) no necesita este límite tan ajustado.
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { mensaje: 'Demasiados intentos. Probá de nuevo en unos minutos.' }
});

module.exports = authRateLimiter;
