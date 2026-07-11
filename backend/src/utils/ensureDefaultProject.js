const Project = require('../models/Project');

// Devuelve el proyecto "General" de la organización, creándolo si todavía no existe
const ensureDefaultProject = async (orgId, userId) => {
    let proyecto = await Project.findOne({ org: orgId, isDefault: true });

    if (!proyecto) {
        proyecto = await Project.create({
            name: 'General',
            color: 'indigo',
            org: orgId,
            createdBy: userId,
            isDefault: true
        });
    }

    return proyecto;
};

module.exports = ensureDefaultProject;
