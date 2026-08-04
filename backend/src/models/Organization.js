const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    inviteToken: {
        type: String,
        unique: true,
        sparse: true
    },
    inviteTokenExpiresAt: {
        type: Date,
        default: null
    },
    logoUrl: {
        type: String,
        default: null
    },
    industry: {
        type: String,
        default: '',
        trim: true
    },
    address: {
        type: String,
        default: '',
        trim: true
    },
    taxId: {
        type: String,
        default: '',
        trim: true
    },
    // Gmail de la empresa desde la que salen los emails automáticos (ej. "te
    // asignaron una tarea"). La contraseña de aplicación queda encriptada y
    // con select:false — nunca se devuelve en una consulta normal.
    notificationEmail: {
        type: String,
        default: null,
        trim: true,
        lowercase: true
    },
    notificationEmailAppPasswordEnc: {
        type: String,
        default: null,
        select: false
    },
    // Último error al mandar un email automático (asignación, invitación o
    // prueba) — si no, esos envíos fallan en silencio y nadie se entera hasta
    // que un empleado dice que nunca le llegó nada. Se limpia solo en el
    // próximo envío exitoso.
    notificationEmailLastError: {
        type: String,
        default: null
    },
    notificationEmailLastErrorAt: {
        type: Date,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
