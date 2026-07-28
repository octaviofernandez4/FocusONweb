const User = require('../models/User');
const Organization = require('../models/Organization');
const Membership = require('../models/Membership');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ensureDefaultProject = require('../utils/ensureDefaultProject');

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
            await ensureDefaultProject(organizacion._id, nuevoUsuario._id);
        }

        // El tipo de cuenta (qué panel ve, si puede invitar) es independiente del
        // rol técnico de Membership: quien se une por invitación siempre es
        // "empleado"; si no, respeta lo que eligió en el formulario de registro.
        nuevoUsuario.currentOrg = organizacion._id;
        nuevoUsuario.accountType = seUnioPorInvitacion ? 'empleado' : (accountType === 'empleado' ? 'empleado' : 'empresa');
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
        const usuario = await User.findById(req.user.id).select('name lastname email statusText currentOrg accountType');

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
        const { name, lastname, statusText } = req.body;
        const datosAActualizar = {};
        if (name !== undefined) datosAActualizar.name = name;
        if (lastname !== undefined) datosAActualizar.lastname = lastname;
        if (statusText !== undefined) datosAActualizar.statusText = statusText;

        const usuarioActualizado = await User.findByIdAndUpdate(
            req.user.id,
            datosAActualizar,
            { new: true }
        ).select('name lastname email statusText currentOrg');

        res.status(200).json({ mensaje: '✏️ Perfil actualizado', usuario: usuarioActualizado });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar el perfil', error: error.message });
    }
};

module.exports = {
    crearUsuario,
    loginUsuario,
    obtenerPerfil,
    actualizarPerfil
};