// Script manual de migración: crea organizaciones personales para usuarios
// que todavía no pertenecen a ninguna, y reasigna sus tareas viejas.
//
// Uso: node scripts/migrate-orgs.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Task = require('../src/models/Task');
const Organization = require('../src/models/Organization');
const Membership = require('../src/models/Membership');
const ensureDefaultProject = require('../src/utils/ensureDefaultProject');

const migrar = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔥 Conectado a MongoDB');

    const usuarios = await User.find({});
    let usuariosMigrados = 0;

    for (const usuario of usuarios) {
        let membresia = await Membership.findOne({ user: usuario._id });

        if (!membresia) {
            const organizacion = await Organization.create({
                name: `Espacio de ${usuario.name}`,
                createdBy: usuario._id
            });

            membresia = await Membership.create({
                org: organizacion._id,
                user: usuario._id,
                role: 'admin'
            });

            await ensureDefaultProject(organizacion._id, usuario._id);

            usuariosMigrados++;
        }

        if (!usuario.currentOrg) {
            usuario.currentOrg = membresia.org;
            await usuario.save();
        }
    }

    console.log(`✅ ${usuariosMigrados} usuario(s) recibieron una organización nueva`);

    let tareasMigradas = 0;
    const tareasSinOrg = await Task.find({ org: { $exists: false } });

    for (const tarea of tareasSinOrg) {
        const membresia = await Membership.findOne({ user: tarea.user });
        if (!membresia) continue;

        const proyectoGeneral = await ensureDefaultProject(membresia.org, tarea.user);

        tarea.org = membresia.org;
        tarea.project = proyectoGeneral._id;
        await tarea.save();
        tareasMigradas++;
    }

    console.log(`✅ ${tareasMigradas} tarea(s) reasignadas a su organización y proyecto General`);

    await mongoose.disconnect();
    console.log('🏁 Migración completa');
};

migrar().catch((error) => {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
});
