// Corta el arranque con un error claro si falta una variable de entorno
// imprescindible, en vez de dejar que explote más tarde con un error críptico
// en el primer request (ej. "jwt malformed" por JWT_SECRET undefined).
const REQUERIDAS = ['MONGODB_URI', 'JWT_SECRET', 'CREDENTIALS_ENCRYPTION_KEY'];

// Sin estas, el servidor arranca igual — pero cualquier request que suba un
// archivo va a fallar. Solo avisamos, no cortamos el arranque.
const RECOMENDADAS = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'FRONTEND_URL', 'SYSTEM_EMAIL_USER', 'SYSTEM_EMAIL_APP_PASSWORD'];

const validateEnv = () => {
    const faltantes = REQUERIDAS.filter((clave) => !process.env[clave]);
    if (faltantes.length > 0) {
        console.error(`❌ Faltan variables de entorno obligatorias: ${faltantes.join(', ')}`);
        console.error('   Revisá tu .env (o las variables configuradas en el hosting) contra .env.example');
        process.exit(1);
    }

    const avisos = RECOMENDADAS.filter((clave) => !process.env[clave]);
    if (avisos.length > 0) {
        console.warn(`⚠️  Faltan variables de entorno recomendadas: ${avisos.join(', ')} — el servidor arranca igual, pero las funciones que dependen de ellas van a fallar (ej. subir archivos sin Cloudinary).`);
    }
};

module.exports = validateEnv;
