const { check, validationResult } = require('express-validator');

const validarTarea = [
    check('title', 'El título de la tarea es obligatorio').not().isEmpty(),
    check('description').optional().trim(), // ← Solo este cambio
    check('priority').optional().isIn(['low', 'medium', 'high']).withMessage('La prioridad debe ser low, medium o high'),
    check('project').optional().isMongoId().withMessage('El proyecto no es válido'),

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