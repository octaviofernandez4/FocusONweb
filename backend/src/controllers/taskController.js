const Task = require('../models/Task');
const Membership = require('../models/Membership');
const ensureDefaultProject = require('../utils/ensureDefaultProject');

// 1. Crear tarea
const crearTarea = async (req, res) => {
    try {
        const { title, description, dueDate, priority, project } = req.body;

        const proyecto = project || (await ensureDefaultProject(req.orgId, req.user.id))._id;

        const nuevaTarea = new Task({
            title,
            description,
            dueDate,
            priority,
            project: proyecto,
            user: req.user.id,
            org: req.orgId
        });

        await nuevaTarea.save();
        res.status(201).json({ mensaje: '✅ Tarea creada con éxito', tarea: nuevaTarea });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: '❌ Error al crear la tarea', error: error.message });
    }
};

// 2. Obtener tareas de la organización (con filtro opcional por proyecto)
const obtenerTareas = async (req, res) => {
    try {
        const filtro = { org: req.orgId };
        if (req.query.project) {
            filtro.project = req.query.project;
        }

        const tareas = await Task.find(filtro)
            .populate('user', 'name lastname email')
            .populate('project', 'name color')
            .sort({ dueDate: 1 });

        res.status(200).json(tareas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener las tareas', error: error.message });
    }
};

// 3. Estadísticas de tareas de la organización
const obtenerEstadisticasTareas = async (req, res) => {
    try {
        const ahora = new Date();
        const hace7dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [totalCompleted, completedThisWeek, missedCount] = await Promise.all([
            Task.countDocuments({ org: req.orgId, completed: true }),
            Task.countDocuments({ org: req.orgId, completed: true, completedAt: { $gte: hace7dias } }),
            Task.countDocuments({ org: req.orgId, completed: false, dueDate: { $lt: ahora } })
        ]);

        const totalConsiderado = totalCompleted + missedCount;
        const completionRate = totalConsiderado === 0 ? 0 : Math.round((totalCompleted / totalConsiderado) * 100);

        res.status(200).json({ totalCompleted, completedThisWeek, missedCount, completionRate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener las estadísticas', error: error.message });
    }
};

// 4. Restaurar todas las tareas completadas/perdidas (cualquier miembro)
const restaurarTareasCompletadas = async (req, res) => {
    try {
        const ahora = new Date();

        await Task.updateMany(
            { org: req.orgId, completed: true },
            { completed: false, completedAt: null }
        );

        await Task.updateMany(
            { org: req.orgId, completed: false, dueDate: { $lt: ahora } },
            { dueDate: ahora }
        );

        res.status(200).json({ mensaje: '↩️ Tareas restauradas correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al restaurar las tareas', error: error.message });
    }
};

// 5. Borrar definitivamente todas las tareas completadas/perdidas (solo admin)
const limpiarTareasCompletadas = async (req, res) => {
    try {
        const ahora = new Date();

        await Task.deleteMany({
            org: req.orgId,
            $or: [
                { completed: true },
                { completed: false, dueDate: { $lt: ahora } }
            ]
        });

        res.status(200).json({ mensaje: '🗑️ Tareas completadas eliminadas' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al limpiar las tareas', error: error.message });
    }
};

// 6. Actualizar tarea (cualquier miembro de la organización)
const actualizarTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, dueDate, completed, project, priority } = req.body;
        const datosAActualizar = { title, description, dueDate, completed, project, priority };

        if (completed !== undefined) {
            datosAActualizar.completedAt = completed ? new Date() : null;
        }

        const tareaActualizada = await Task.findOneAndUpdate(
            { _id: id, org: req.orgId },
            datosAActualizar,
            { new: true }
        );

        if (!tareaActualizada) {
            return res.status(404).json({ mensaje: 'La tarea no existe en esta organización 🛑' });
        }

        res.status(200).json({ mensaje: '✏️ Tarea actualizada con éxito', tarea: tareaActualizada });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar la tarea', error: error.message });
    }
};

// 7. Borrar tarea (solo quien la creó o un admin de la organización)
const borrarTarea = async (req, res) => {
    try {
        const { id } = req.params;

        const tarea = await Task.findOne({ _id: id, org: req.orgId });
        if (!tarea) {
            return res.status(404).json({ mensaje: 'La tarea no existe en esta organización 🛑' });
        }

        const esCreador = tarea.user.equals(req.user.id);

        if (!esCreador) {
            const membresia = await Membership.findOne({ org: req.orgId, user: req.user.id });
            if (!membresia || membresia.role !== 'admin') {
                return res.status(403).json({ mensaje: 'Solo quien creó la tarea o un admin puede borrarla 🛑' });
            }
        }

        await tarea.deleteOne();

        res.status(200).json({ mensaje: '🗑️ Tarea eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al borrar la tarea', error: error.message });
    }
};

module.exports = {
    crearTarea,
    obtenerTareas,
    obtenerEstadisticasTareas,
    restaurarTareasCompletadas,
    limpiarTareasCompletadas,
    actualizarTarea,
    borrarTarea
};
