const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'El título no puede superar los 200 caracteres']
    },
    description: {
        type: String,
        required: false,
        maxlength: [5000, 'La descripción no puede superar los 5000 caracteres']
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
    inProgress: {
        // El asignado marcó que ya empezó a trabajar en la tarea — distinto de
        // pendingReview (que es "la mandé a revisión"), es solo un indicador
        // de seguimiento personal antes de enviarla.
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
    qualityLevel: {
        // Nivel de calidad que la empresa le pone a una tarea al aprobarla.
        type: String,
        enum: ['standard', 'needs_adjustments'],
        default: null
    },
    completionComment: {
        type: String,
        default: ''
    },
    // La empresa le pide una aclaración a la persona asignada antes de aprobar
    // o reabrir (ej. una pregunta puntual sobre el trabajo entregado) — es un
    // solo hilo activo por vez, no una mensajería completa.
    clarificationRequested: {
        type: Boolean,
        default: false
    },
    clarificationQuestion: {
        type: String,
        default: '',
        maxlength: [1000, 'La pregunta no puede superar los 1000 caracteres']
    },
    clarificationRequestedAt: {
        type: Date,
        default: null
    },
    clarificationAnswer: {
        type: String,
        default: '',
        maxlength: [1000, 'La respuesta no puede superar los 1000 caracteres']
    },
    clarificationAnsweredAt: {
        type: Date,
        default: null
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    estimatedHours: {
        // Cuánto tiempo estima la empresa que va a llevar — opcional, informativo,
        // no afecta ninguna regla de negocio.
        type: Number,
        default: null,
        min: 0,
        max: 999
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

// Toda consulta de tareas filtra por organización, y la mayoría además por
// asignado o por fecha límite (mis tareas, stats, vencidas) — sin esto cada
// consulta escanea la colección entera a medida que crece.
taskSchema.index({ org: 1, assignedTo: 1 });
taskSchema.index({ org: 1, dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);