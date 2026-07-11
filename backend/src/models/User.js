const mongoose = require('mongoose');

// Definimos la estructura que tendrá cada usuario
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true // Borra espacios extra al principio o al final
    },
    lastname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // MongoDB se asegurará de que no se repita el email
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    currentOrg: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
    statusText: {
        type: String,
        default: 'Enfocado',
        trim: true
    }
}, {
    // Esto es un toque pro: agrega automáticamente la fecha de creación y actualización
    timestamps: true 
});

// Exportamos el modelo para usarlo en los controladores
module.exports = mongoose.model('User', userSchema);