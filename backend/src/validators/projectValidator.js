const { check, validationResult } = require('express-validator');

const validarProyecto = [
    check('name', 'El nombre del proyecto es obligatorio').not().isEmpty(),
    check('color').optional().trim(),

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
