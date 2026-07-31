const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    dueDate: {
        type: Date,
        required: false
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date,
        default: null
    },
    pendingReview: {
        type: Boolean,
        default: false
    },
    extensionRequested: {
        // La persona asignada pidió más tiempo en una tarea vencida; solo una
        // cuenta empresa puede resolverlo poniéndole una nueva fecha límite.
        type: Boolean,
        default: false
    },
    extensionReason: {
        type: String,
        default: ''
    },
    extensionProposedDate: {
        type: Date,
        default: null
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    user: {
        // Quién creó la tarea (siempre una cuenta empresa, ver crearTarea)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        // A quién se le asignó la tarea (opcional — puede quedar sin asignar)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    org: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    project: {
        // Opcional — una tarea puede no pertenecer a ningún proyecto en particular
        // (ya no existe un proyecto "General" automático; para eso está el filtro "Todas").
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },
    attachments: {
        type: [{
            name: String,
            url: String,
            size: Number,
            type: String
        }],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);