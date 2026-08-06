// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // 1. Buscamos el token en la cabecera (Header) de la petición
    
    const authHeader = req.header('Authorization');

    // Si no viene nada en la cabecera, rebotamos

    if (!authHeader) {
        return res.status(401).json({ mensaje: 'Acceso denegado. No se encontró el token.' });
    }

    try {
        // El formato es "Bearer eyJhbGci...", cortamos para quedarnos con el código
        const token = authHeader.split(' ')[1];

        // 2. Verificamos que el token sea original usando la firma del .env

        // IMPORTANTE: process.env.JWT_SECRET tiene que ser igual al del Login

        const decodificado = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

        // 3. Guardamos los datos del usuario (ID) para que los controladores lo usen
        req.user = decodificado;

        // 4. Todo ok, pasamos a la siguiente función
        next();
    } catch (error) {
        // Imprimimos el error real en la terminal para saber qué falló
        console.log("🕵️‍♂️ Motivo del rechazo:", error.message);
        res.status(401).json({ mensaje: 'El token no es válido o ya expiró' });
    }
};

module.exports = authMiddleware;