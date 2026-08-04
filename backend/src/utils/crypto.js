const crypto = require('crypto');

const ALGORITMO = 'aes-256-gcm';

// Clave PROPIA para encriptar credenciales (contraseñas de aplicación de Gmail),
// separada del JWT_SECRET a propósito: si alguna vez rotás el JWT_SECRET (por
// seguridad, por migración), no queremos que de paso se vuelvan indescifrables
// TODAS las contraseñas ya guardadas de TODAS las organizaciones.
const getKey = () => {
    if (!process.env.CREDENTIALS_ENCRYPTION_KEY) {
        throw new Error('Falta CREDENTIALS_ENCRYPTION_KEY en las variables de entorno');
    }
    return crypto.createHash('sha256').update(process.env.CREDENTIALS_ENCRYPTION_KEY).digest();
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
