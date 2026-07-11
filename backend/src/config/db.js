const mongoose = require('mongoose');


const connectDB = async () => {
    try {
        // Intentamos la conexión usando la URL del .env
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔥🔥🔥 Base de datos MongoDB conectada exitosamente');
    } catch (error) {
        console.error('❌❌❌ Error conectando a MongoDB:', error.message);
        // Si falla, cerramos la aplicación para evitar errores mayores
        process.exit(1);
    }
};

module.exports = connectDB;