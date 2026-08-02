const { check, validationResult } = require('express-validator');

const validarRegistro = [
    check('name', 'El nombre es obligatorio').not().isEmpty(),
    check('lastname', 'El apellido es obligatorio').not().isEmpty(),
    check('email', 'Debe ser un email válido').isEmail().normalizeEmail({
        gmail_remove_dots: false,
        gmail_remove_subaddress: false,
        outlookdotcom_remove_subaddress: false,
        yahoo_remove_subaddress: false,
        icloud_remove_subaddress: false
    }),
    check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
    check('inviteToken').optional().trim(),
    check('companyName').optional().trim(),
    check('accountType').optional().isIn(['empresa', 'empleado']).withMessage('El tipo de cuenta no es válido'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errores: errors.array() });
        }
        next();
    }
];

const validarActualizacionPerfil = [
    check('name').optional().not().isEmpty().withMessage('El nombre no puede estar vacío'),
    check('lastname').optional().not().isEmpty().withMessage('El apellido no puede estar vacío'),
    check('statusText').optional().trim(),
    check('avatarUrl').optional({ checkFalsy: true }).isString().withMessage('La foto de perfil no es válida'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errores: errors.array() });
        }
        next();
    }
];


const validarLogin = [
    check('email', 'Debe ser un email válido').isEmail().normalizeEmail({
        gmail_remove_dots: false,
        gmail_remove_subaddress: false,
        outlookdotcom_remove_subaddress: false,
        yahoo_remove_subaddress: false,
        icloud_remove_subaddress: false
    }),
    check('password', 'La contraseña es obligatoria').not().isEmpty(),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errores: errors.array() });
        }
        next();
    }
];

const validarDescartarNotificacion = [
    check('taskId', 'El ID de la tarea no es válido').isMongoId(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errores: errors.array() });
        }
        next();
    }
];

module.exports = {
    validarRegistro,
    validarLogin,
    validarActualizacionPerfil,
    validarDescartarNotificacion
};