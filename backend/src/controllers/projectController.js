const Project = require('../models/Project');
const Task = require('../models/Task');

// 1. Obtener los proyectos de la organización activa
const obtenerProyectos = async (req, res) => {
    try {
        const proyectos = await Project.find({ org: req.orgId }).sort({ isDefault: -1, createdAt: 1 });
        res.status(200).json(proyectos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener los proyectos', error: error.message });
    }
};

// 2. Crear un proyecto nuevo
const crearProyecto = async (req, res) => {
    try {
        const { name, color } = req.body;

        const nuevoProyecto = new Project({
            name,
            color: color || 'indigo',
            org: req.orgId,
            createdBy: req.user.id
        });

        await nuevoProyecto.save();
        res.status(201).json({ mensaje: '✅ Proyecto creado con éxito', proyecto: nuevoProyecto });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear el proyecto', error: error.message });
    }
};

// 3. Actualizar un proyecto
const actualizarProyecto = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, color } = req.body;

        const proyectoActualizado = await Project.findOneAndUpdate(
            { _id: id, org: req.orgId },
            { name, color },
            { new: true }
        );

        if (!proyectoActualizado) {
            return res.status(404).json({ mensaje: 'El proyecto no existe en esta organización' });
        }

        res.status(200).json({ mensaje: '✏️ Proyecto actualizado', proyecto: proyectoActualizado });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar el proyecto', error: error.message });
    }
};

// 4. Borrar un proyecto (no permitido si es el proyecto default o si tiene tareas)
const borrarProyecto = async (req, res) => {
    try {
        const { id } = req.params;

        const proyecto = await Project.findOne({ _id: id, org: req.orgId });
        if (!proyecto) {
            return res.status(404).json({ mensaje: 'El proyecto no existe en esta organización' });
        }

        if (proyecto.isDefault) {
            return res.status(409).json({ mensaje: 'No se puede borrar el proyecto General' });
        }

        const tareasAsociadas = await Task.countDocuments({ project: id });
        if (tareasAsociadas > 0) {
            return res.status(409).json({ mensaje: 'No se puede borrar un proyecto que todavía tiene tareas' });
        }

        await proyecto.deleteOne();
        res.status(200).json({ mensaje: '🗑️ Proyecto eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al borrar el proyecto', error: error.message });
    }
};

module.exports = {
    obtenerProyectos,
    crearProyecto,
    actualizarProyecto,
    borrarProyecto
};
