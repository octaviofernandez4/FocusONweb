const crypto = require('crypto');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Membership = require('../models/Membership');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { enviarEmailResetContrasena } = require('../utils/mailer');

const UNA_HORA_MS = 60 * 60 * 1000;

// 1. Registrar un nuevo usuario (ahora con contraseña encriptada)
const crearUsuario = async (req, res) => {
    try {
        const { name, lastname, email, password, inviteToken, companyName, accountType } = req.body;

        // Verificamos si el correo ya está registrado para no tener duplicados
        const usuarioExiste = await User.findOne({ email });
        if (usuarioExiste) {
            return res.status(400).json({ mensaje: 'El correo ya está registrado' });
        }

        // Magia de bcrypt: Hasheamos (encriptamos) la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHasheada = await bcrypt.hash(password, salt);

        // Armamos el usuario PERO le pasamos la contraseña encriptada
        const nuevoUsuario = new User({
            name,
            lastname,
            email,
            password: passwordHasheada
        });

        await nuevoUsuario.save();

        // Si vino un token de invitación válido, se une a esa organización como miembro.
        // Si no, se le crea su propia organización personal (necesaria para que
        // funcione el resto del backend) y queda como admin de ESA organización.
        let organizacion = inviteToken ? await Organization.findOne({ inviteToken }) : null;
        const seUnioPorInvitacion = Boolean(organizacion);

        if (organizacion) {
            await Membership.create({ org: organizacion._id, user: nuevoUsuario._id, role: 'member' });
        } else {
            organizacion = await Organization.create({
                name: companyName || `Espacio de ${name}`,
                createdBy: nuevoUsuario._id
            });
            await Membership.create({ org: organizacion._id, user: nuevoUsuario._id, role: 'admin' });
        }

        // El tipo de cuenta (qué panel ve, si puede invitar) es independiente del
        // rol técnico de Membership: quien se une por invitación siempre es
        // "empleado"; si no, respeta lo que eligió en el formulario de registro.
        nuevoUsuario.currentOrg = organizacion._id;
        nuevoUsuario.accountType = seUnioPorInvitacion ? 'empleado' : (accountType === 'empleado' ? 'empleado' : 'empresa');
        // Solo una cuenta empresa recién fundada (no alguien que se unió por
        // invitación) tiene sentido que pase por el wizard de bienvenida.
        if (nuevoUsuario.accountType === 'empresa') {
            nuevoUsuario.onboardingCompleted = false;
        }
        await nuevoUsuario.save();

        res.status(201).json({
            mensaje: '¡Usuario creado con éxito y contraseña blindada! 🛡️',
            // Nunca devolvemos la contraseña al frontend, ni siquiera la hasheada
            usuario: { id: nuevoUsuario._id, name: nuevoUsuario.name, email: nuevoUsuario.email }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear el usuario', error: error.message });
    }
};

// 2. Iniciar Sesión (NUEVO)
const loginUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Verificamos si existe alguien con ese email
        const usuario = await User.findOne({ email });
        if (!usuario) {
            return res.status(400).json({ mensaje: 'Credenciales inválidas (email no encontrado)' });
        }

        // 2. Comparamos la contraseña que tipeó con el hash guardado en MongoDB
        const passwordCorrecta = await bcrypt.compare(password, usuario.password);
        if (!passwordCorrecta) {
            return res.status(400).json({ mensaje: 'Credenciales inválidas (contraseña incorrecta)' });
        }

        // 3. Generamos el Token JWT (el Pase VIP)
        const token = jwt.sign(
            { id: usuario._id }, // Guardamos el ID del usuario oculto adentro del token
            process.env.JWT_SECRET, // Firmamos con tu secreto del .env
            { expiresIn: '2h' } // Le damos 2 horas de validez
        );

        res.status(200).json({ 
            mensaje: 'lo lograste te logueaste! 🚀',
            token, // Le mandamos el token al frontend
            usuario: { id: usuario._id, name: usuario.name, email: usuario.email }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al iniciar sesión', error: error.message });
    }
};

// 3. Obtener el perfil del usuario autenticado
const obtenerPerfil = async (req, res) => {
    try {
        const usuario = await User.findById(req.user.id).select('name lastname email statusText currentOrg accountType avatarUrl dismissedNotifications onboardingCompleted');

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        res.status(200).json(usuario);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener el perfil', error: error.message });
    }
};

// 4. Actualizar el perfil del usuario autenticado (whitelist de campos)
const actualizarPerfil = async (req, res) => {
    try {
        const { name, lastname, statusText, avatarUrl, onboardingCompleted } = req.body;
        const datosAActualizar = {};
        if (name !== undefined) datosAActualizar.name = name;
        if (lastname !== undefined) datosAActualizar.lastname = lastname;
        if (statusText !== undefined) datosAActualizar.statusText = statusText;
        if (avatarUrl !== undefined) datosAActualizar.avatarUrl = avatarUrl;
        if (onboardingCompleted !== undefined) datosAActualizar.onboardingCompleted = onboardingCompleted;

        const usuarioActualizado = await User.findByIdAndUpdate(
            req.user.id,
            datosAActualizar,
            { new: true }
        ).select('name lastname email statusText currentOrg avatarUrl onboardingCompleted');

        res.status(200).json({ mensaje: '✏️ Perfil actualizado', usuario: usuarioActualizado });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar el perfil', error: error.message });
    }
};

// 5. Cambiar la contraseña del usuario autenticado (pide la actual para confirmar)
const cambiarContrasena = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const usuario = await User.findById(req.user.id);
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const passwordCorrecta = await bcrypt.compare(currentPassword, usuario.password);
        if (!passwordCorrecta) {
            return res.status(400).json({ mensaje: 'La contraseña actual no es correcta' });
        }

        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(newPassword, salt);
        await usuario.save();

        res.status(200).json({ mensaje: '🔒 Contraseña actualizada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al cambiar la contraseña', error: error.message });
    }
};

// 6. Pedir un link para recuperar la contraseña (sin sesión iniciada). Siempre
// responde el mismo mensaje genérico exista o no ese email — si no, cualquiera
// podría usar este endpoint para averiguar qué emails están registrados.
const RESPUESTA_GENERICA_RESET = { mensaje: 'Si ese email está registrado, te mandamos un link para restablecer tu contraseña.' };

const solicitarResetContrasena = async (req, res) => {
    try {
        const { email } = req.body;

        const usuario = await User.findOne({ email: email.toLowerCase().trim() });
        if (!usuario) {
            return res.status(200).json(RESPUESTA_GENERICA_RESET);
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        usuario.passwordResetToken = resetToken;
        usuario.passwordResetTokenExpiresAt = new Date(Date.now() + UNA_HORA_MS);
        await usuario.save();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        await enviarEmailResetContrasena({ destinatario: usuario.email, nombreDestinatario: usuario.name, resetUrl });

        res.status(200).json(RESPUESTA_GENERICA_RESET);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al solicitar la recuperación de contraseña', error: error.message });
    }
};

// 7. Completar la recuperación de contraseña con el token que llegó por email
const resetearContrasena = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        const usuario = await User.findOne({
            passwordResetToken: token,
            passwordResetTokenExpiresAt: { $gt: new Date() }
        }).select('+passwordResetToken +passwordResetTokenExpiresAt');

        if (!usuario) {
            return res.status(400).json({ mensaje: 'El link de recuperación no es válido o ya venció. Pedí uno nuevo.' });
        }

        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(newPassword, salt);
        usuario.passwordResetToken = null;
        usuario.passwordResetTokenExpiresAt = null;
        await usuario.save();

        res.status(200).json({ mensaje: '🔒 Contraseña restablecida — ya podés iniciar sesión' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al restablecer la contraseña', error: error.message });
    }
};

// 6. Descartar una notificación (derivada de una tarea) para el usuario autenticado.
// Queda guardada para siempre — no hay forma de "recuperarla" por ahora, es
// el mismo comportamiento que tenía el "Ignorar" cuando era solo en memoria.
const descartarNotificacion = async (req, res) => {
    try {
        const { taskId } = req.body;
        if (!taskId) {
            return res.status(400).json({ mensaje: 'Falta el ID de la tarea' });
        }

        const usuario = await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { dismissedNotifications: taskId } },
            { new: true }
        ).select('dismissedNotifications');

        res.status(200).json({ mensaje: '🔕 Notificación descartada', dismissedNotifications: usuario.dismissedNotifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al descartar la notificación', error: error.message });
    }
};

module.exports = {
    crearUsuario,
    loginUsuario,
    obtenerPerfil,
    actualizarPerfil,
    cambiarContrasena,
    solicitarResetContrasena,
    resetearContrasena,
    descartarNotificacion
};