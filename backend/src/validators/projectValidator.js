const { check, validationResult } = require('express-validator');

// Tiene que coincidir con las claves de PROJECT_COLORS en frontend/src/utils/projectColors.js
const COLORES_VALIDOS = ['indigo', 'pink', 'emerald', 'amber', 'sky', 'violet', 'rose', 'teal'];

const validarProyecto = [
    check('name', 'El nombre del proyecto es obligatorio').not().isEmpty(),
    check('color').optional().trim().isIn(COLORES_VALIDOS).withMessage('El color del proyecto no es válido'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errores: errors.array() });
        }
        next();
    }
];

module.exports = {
    validarProyecto
};
