const crypto = require('crypto');
const Organization = require('../models/Organization');
const Membership = require('../models/Membership');
const User = require('../models/User');

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
        res.status(500).json({ mensaje: 'Error al obtener la organización', error: error.message });
    }
};

// 2. Renombrar la organización (solo admin)
const actualizarOrganizacion = async (req, res) => {
    try {
        const { name } = req.body;

        const organizacion = await Organization.findByIdAndUpdate(
            req.orgId,
            { name },
            { new: true }
        );

        res.status(200).json({ mensaje: '✏️ Organización actualizada', organizacion });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar la organización', error: error.message });
    }
};

// 3. Listar miembros de la organización
const listarMiembros = async (req, res) => {
    try {
        const membresias = await Membership.find({ org: req.orgId }).populate('user', 'name lastname email statusText');

        res.status(200).json(membresias.map((m) => ({
            id: m.user._id,
            name: m.user.name,
            lastname: m.user.lastname,
            email: m.user.email,
            statusText: m.user.statusText,
            role: m.role
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al listar los miembros', error: error.message });
    }
};

// 4. Generar (o regenerar) el link de invitación (solo admin)
const generarInvitacion = async (req, res) => {
    try {
        const inviteToken = crypto.randomBytes(16).toString('hex');

        const organizacion = await Organization.findByIdAndUpdate(
            req.orgId,
            { inviteToken },
            { new: true }
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        res.status(200).json({
            mensaje: '🔗 Link de invitación generado',
            inviteToken,
            inviteUrl: `${frontendUrl}/join/${inviteToken}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al generar la invitación', error: error.message });
    }
};

// 5. Unirse a una organización mediante un token de invitación
const unirseAOrganizacion = async (req, res) => {
    try {
        const { token } = req.params;

        const organizacion = await Organization.findOne({ inviteToken: token });
        if (!organizacion) {
            return res.status(404).json({ mensaje: 'El link de invitación no es válido' });
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
        res.status(500).json({ mensaje: 'Error al unirse a la organización', error: error.message });
    }
};

module.exports = {
    obtenerOrganizacionActual,
    actualizarOrganizacion,
    listarMiembros,
    generarInvitacion,
    unirseAOrganizacion
};
