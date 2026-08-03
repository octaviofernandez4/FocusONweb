const crypto = require('crypto');

const ALGORITMO = 'aes-256-gcm';

// Derivamos la clave de encriptación del mismo JWT_SECRET que ya usa toda la
// app (con un contexto distinto para no reusar la clave cruda), así no hace
// falta pedirle al usuario un secreto más en el .env.
const getKey = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error('Falta JWT_SECRET en las variables de entorno');
    }
    return crypto.createHash('sha256').update(`${process.env.JWT_SECRET}:org-credentials`).digest();
};

// Encripta un texto plano (ej. una contraseña de aplicación de Gmail) para guardarlo en la base.
const encrypt = (texto) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITMO, getKey(), iv);
    const cifrado = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv, authTag, cifrado].map((buffer) => buffer.toString('hex')).join(':');
};

// Revierte encrypt(). Tira si el payload fue manipulado (falla la verificación del authTag).
const decrypt = (payload) => {
    const [ivHex, authTagHex, cifradoHex] = payload.split(':');
    const decipher = crypto.createDecipheriv(ALGORITMO, getKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    const descifrado = Buffer.concat([decipher.update(Buffer.from(cifradoHex, 'hex')), decipher.final()]);
    return descifrado.toString('utf8');
};

module.exports = { encrypt, decrypt };
