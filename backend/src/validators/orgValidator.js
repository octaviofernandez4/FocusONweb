const { check, validationResult } = require('express-validator');

const validarOrganizacion = [
    check('name', 'El nombre de la organización es obligatorio').not().isEmpty(),
    check('logoUrl').optional({ checkFalsy: true }).isString().withMessage('El logo no es válido'),
    check('industry').optional({ checkFalsy: true }).isString(),
    check('address').optional({ checkFalsy: true }).isString(),
    check('taxId').optional({ checkFalsy: true }).isString(),
    check('notificationEmail').optional({ checkFalsy: true }).isEmail().withMessage('El email de notificaciones no es válido'),
    check('notificationEmailAppPassword').optional({ checkFalsy: true }).isString().isLength({ max: 64 }).withMessage('La contraseña de aplicación no es válida'),

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
