const { check, validationResult } = require('express-validator');

const validarOrganizacion = [
    check('name', 'El nombre de la organización es obligatorio').not().isEmpty(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errores: errors.array() });
        }
        next();
    }
];

module.exports = {
    validarOrganizacion
};
