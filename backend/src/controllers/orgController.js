const crypto = require('crypto');
const Organization = require('../models/Organization');
const Membership = require('../models/Membership');
const User = require('../models/User');
const { encrypt } = require('../utils/crypto');
const { enviarEmailInvitacion, enviarEmailPrueba } = require('../utils/mailer');
const { detalleError } = require('../utils/errorResponse');
const Task = require('../models/Task');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

// 1. Obtener la organización activa del usuario
const obtenerOrganizacionActual = async (req, res) => {
    try {
        const [organizacion, membresia] = await Promise.all([
            Organization.findById(req.orgId),
            Membership.findOne({ org: req.orgId, user: req.user.id })
        ]);

        if (!organizacion) {
            return res.status(404).json({ mensaje: 'Organización no encontrada' });
        }

        res.status(200).json({
            organizacion,
            role: membresia ? membresia.role : null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener la organización', error: detalleError(error) });
    }
};

// 2. Renombrar la organización y/o cambiar su logo/rubro/dirección/email de notificaciones (solo admin)
const actualizarOrganizacion = async (req, res) => {
    try {
        const { name, logoUrl, industry, address, taxId, notificationEmail, notificationEmailAppPassword } = req.body;

        const datosAActualizar = { name };
        if (logoUrl !== undefined) datosAActualizar.logoUrl = logoUrl;
        if (industry !== undefined) datosAActualizar.industry = industry;
        if (address !== undefined) datosAActualizar.address = address;
        if (taxId !== undefined) datosAActualizar.taxId = taxId;
        if (notificationEmail !== undefined) datosAActualizar.notificationEmail = notificationEmail || null;
        if (notificationEmailAppPassword !== undefined) {
            // Contraseña vacía = el admin quiere desactivar el envío de emails.
            datosAActualizar.notificationEmailAppPasswordEnc = notificationEmailAppPassword
                ? encrypt(notificationEmailAppPassword.replace(/\s+/g, ''))
                : null;
        }

        const organizacion = await Organization.findByIdAndUpdate(
            req.orgId,
            datosAActualizar,
            { new: true }
        );

        res.status(200).json({ mensaje: '✏️ Organización actualizada', organizacion });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar la organización', error: detalleError(error) });
    }
};

// 3. Listar miembros de la organización
const listarMiembros = async (req, res) => {
    try {
        const membresias = await Membership.find({ org: req.orgId }).populate('user', 'name lastname email statusText avatarUrl');

        res.status(200).json(membresias.map((m) => ({
            id: m.user._id,
            name: m.user.name,
            lastname: m.user.lastname,
            email: m.user.email,
            statusText: m.user.statusText,
            avatarUrl: m.user.avatarUrl,
            role: m.role
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al listar los miembros', error: detalleError(error) });
    }
};

// 4. Eliminar a un miembro de la organización (solo admin)
const eliminarMiembro = async (req, res) => {
    try {
        const { userId } = req.params;

        if (String(userId) === String(req.user.id)) {
            return res.status(400).json({ mensaje: 'No podés eliminarte a vos mismo de la organización' });
        }

        const membresia = await Membership.findOne({ org: req.orgId, user: userId });
        if (!membresia) {
            return res.status(404).json({ mensaje: 'Ese miembro no pertenece a la organización' });
        }

        if (membresia.role === 'admin') {
            const otrosAdmins = await Membership.countDocuments({ org: req.orgId, role: 'admin', user: { $ne: userId } });
            if (otrosAdmins === 0) {
                return res.status(400).json({ mensaje: 'No podés eliminar al único administrador de la organización' });
            }
        }

        await Membership.deleteOne({ _id: membresia._id });

        // Eliminar a alguien es la forma que tiene la empresa de "despedirlo" o
        // dar de baja a quien decidió irse — sus tareas se eliminan con él en
        // vez de quedar huérfanas, para que quede claro que hay que reasignarlas.
        const tareasAEliminar = await Task.find({ org: req.orgId, assignedTo: userId }).select('_id');
        const idsTareasEliminadas = tareasAEliminar.map((t) => t._id);
        await Task.deleteMany({ _id: { $in: idsTareasEliminadas } });

        // Si alguien había descartado alguna de esas tareas de sus notificaciones,
        // ese ID queda guardado para siempre si no se limpia acá.
        if (idsTareasEliminadas.length > 0) {
            await User.updateMany(
                { dismissedNotifications: { $in: idsTareasEliminadas } },
                { $pull: { dismissedNotifications: { $in: idsTareasEliminadas } } }
            );
        }

        // Si esa era su organización activa, se queda sin organización (mismo
        // estado que ya contempla orgMiddleware) hasta que se una a otra.
        await User.updateOne({ _id: userId, currentOrg: req.orgId }, { $unset: { currentOrg: '' } });

        res.status(200).json({ mensaje: 'Miembro eliminado de la organización' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al eliminar al miembro', error: detalleError(error) });
    }
};

// 5. Generar (o regenerar) el link de invitación (solo admin) — vale 7 días.
// Si viene "email" en el body, además intenta mandárselo por mail directamente.
const generarInvitacion = async (req, res) => {
    try {
        // Cuando se abre el modal se llama a este endpoint sin body (para
        // generar el link solo) — axios no manda Content-Type en ese caso,
        // así que express.json() nunca corre y req.body queda undefined.
        const { email } = req.body || {};
        if (email && !EMAIL_REGEX.test(email)) {
            return res.status(400).json({ mensaje: 'El email no es válido' });
        }

        const inviteToken = crypto.randomBytes(16).toString('hex');
        const inviteTokenExpiresAt = new Date(Date.now() + SIETE_DIAS_MS);

        const organizacion = await Organization.findByIdAndUpdate(
            req.orgId,
            { inviteToken, inviteTokenExpiresAt },
            { new: true }
        ).select('name notificationEmail +notificationEmailAppPasswordEnc');

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const inviteUrl = `${frontendUrl}/join/${inviteToken}`;

        if (email) {
            try {
                await enviarEmailInvitacion({ org: organizacion, destinatario: email, inviteUrl });
            } catch (errorEmail) {
                console.error('Error al enviar el email de invitación:', errorEmail);
                const noConfigurado = errorEmail.message === 'La organización no tiene configurado su email de notificaciones';
                // El link ya se generó y es válido — lo devolvemos igual para que
                // el admin lo pueda copiar a mano si el envío automático falló.
                return res.status(502).json({
                    mensaje: noConfigurado
                        ? 'Todavía no configuraste el email de notificaciones de tu empresa.'
                        : 'El link se generó, pero no se pudo enviar el email. Revisá el email de notificaciones en Configuración, o copiá el link manualmente.',
                    noConfigurado,
                    inviteToken,
                    inviteUrl,
                    expiresAt: inviteTokenExpiresAt
                });
            }
        }

        res.status(200).json({
            mensaje: email ? '📧 Invitación enviada por email' : '🔗 Link de invitación generado',
            inviteToken,
            inviteUrl,
            expiresAt: inviteTokenExpiresAt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al generar la invitación', error: detalleError(error) });
    }
};

// 6. Mandar un email de prueba a la propia cuenta configurada (solo admin) —
// para verificar la config sin depender de que se dispare en un flujo real.
const probarEmailNotificaciones = async (req, res) => {
    try {
        const organizacion = await Organization.findById(req.orgId).select('name notificationEmail +notificationEmailAppPasswordEnc');

        if (!organizacion?.notificationEmail) {
            return res.status(400).json({ mensaje: 'Todavía no configuraste el email de notificaciones de tu empresa.' });
        }

        try {
            await enviarEmailPrueba({ org: organizacion });
        } catch (errorEmail) {
            console.error('Error al enviar el email de prueba:', errorEmail);
            return res.status(502).json({ mensaje: `No se pudo enviar el email de prueba: ${errorEmail.message}` });
        }

        res.status(200).json({ mensaje: `📧 Te mandamos un email de prueba a ${organizacion.notificationEmail}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al enviar el email de prueba', error: detalleError(error) });
    }
};

// 7. Unirse a una organización mediante un token de invitación
const unirseAOrganizacion = async (req, res) => {
    try {
        const { token } = req.params;

        const organizacion = await Organization.findOne({ inviteToken: token });
        if (!organizacion) {
            return res.status(404).json({ mensaje: 'El link de invitación no es válido' });
        }

        if (organizacion.inviteTokenExpiresAt && organizacion.inviteTokenExpiresAt < new Date()) {
            return res.status(410).json({ mensaje: 'El link de invitación expiró. Pedile a un admin uno nuevo.' });
        }

        await Membership.findOneAndUpdate(
            { org: organizacion._id, user: req.user.id },
            { $setOnInsert: { role: 'member' } },
            { upsert: true, new: true }
        );

        // Unirse a una organización de otro siempre te marca como "empleado"
        await User.findByIdAndUpdate(req.user.id, { currentOrg: organizacion._id, accountType: 'empleado' });

        res.status(200).json({ mensaje: `🎉 Te uniste a ${organizacion.name}`, organizacion });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al unirse a la organización', error: detalleError(error) });
    }
};

module.exports = {
    obtenerOrganizacionActual,
    actualizarOrganizacion,
    listarMiembros,
    eliminarMiembro,
    generarInvitacion,
    probarEmailNotificaciones,
    unirseAOrganizacion
};
