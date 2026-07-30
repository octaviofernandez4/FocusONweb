const { check, validationResult } = require('express-validator');

const validarOrganizacion = [
    check('name', 'El nombre de la organización es obligatorio').not().isEmpty(),
    check('logoUrl').optional({ checkFalsy: true }).isString().withMessage('El logo no es válido'),
    check('industry').optional({ checkFalsy: true }).isString(),
    check('address').optional({ checkFalsy: true }).isString(),

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
