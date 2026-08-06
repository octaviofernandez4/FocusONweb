const rateLimit = require('express-rate-limit');

// Complementa a authRateLimiter (que es por IP): este limita intentos de login
// por CUENTA (email normalizado), para que repartir los intentos entre muchas
// IPs no sirva para probar contraseñas sin límite contra una cuenta puntual.
// Solo se aplica a /login — compartir este contador con /forgot-password
// bloquearía a un usuario real que, tras fallar el login varias veces, quiere
// pedir un link de recuperación.
const accountRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (req.body?.email || '').toLowerCase().trim() || req.ip,
    message: { mensaje: 'Demasiados intentos para esta cuenta. Probá de nuevo en unos minutos.' }
});

module.exports = accountRateLimiter;
