const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const validarTarea = [
    check('title', 'El título de la tarea es obligatorio').not().isEmpty(),
    check('title').isLength({ max: 200 }).withMessage('El título no puede superar los 200 caracteres'),
    check('description').optional().trim(),
    check('description').optional().isLength({ max: 5000 }).withMessage('La descripción no puede superar los 5000 caracteres'),
    check('priority').optional().isIn(['low', 'medium', 'high']).withMessage('La prioridad debe ser low, medium o high'),
    // El frontend a veces manda "project" ya populado (objeto {_id, name, color})
    // en vez del ID crudo, según de dónde salió la tarea (GET vs POST). Aceptamos ambas formas.
    check('project')
        .optional()
        .custom((value) => {
            const id = value && typeof value === 'object' ? value._id : value;
            return mongoose.Types.ObjectId.isValid(id);
        })
        .withMessage('El proyecto no es válido'),
    check('assignedToEmail').optional({ checkFalsy: true }).isEmail().withMessage('El email de la persona asignada no es válido'),
    check('attachments').optional().isArray().withMessage('Los adjuntos deben ser una lista'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errores: errors.array() });
        }
        next();
    }
];

module.exports = {
    validarTarea
};