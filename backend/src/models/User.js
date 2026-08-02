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
    },
    avatarUrl: {
        type: String,
        default: null
    },
    // Qué tipo de cuenta eligió al registrarse: 'empresa' funda/administra su
    // organización, 'empleado' pertenece a la de alguien más. Es independiente
    // del rol en Membership porque un empleado sin invitación todavía necesita
    // una organización propia "placeholder" por debajo (así funciona el resto
    // del backend), pero no por eso debe verse/actuar como empresa.
    accountType: {
        type: String,
        enum: ['empresa', 'empleado'],
        default: 'empresa'
    },
    // Notificaciones (derivadas de tareas, no tienen colección propia — ver
    // utils/notifications.js en el frontend) que este usuario ya descartó.
    // Guardamos el ID de la tarea que originó la notificación.
    dismissedNotifications: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
        default: []
    }
}, {
    // Esto es un toque pro: agrega automáticamente la fecha de creación y actualización
    timestamps: true 
});

// Exportamos el modelo para usarlo en los controladores
module.exports = mongoose.model('User', userSchema);