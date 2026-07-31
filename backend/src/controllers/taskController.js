const Task = require('../models/Task');
const Membership = require('../models/Membership');
const User = require('../models/User');

// 1. Crear tarea (solo cuenta empresa, ver requireCompanyAccount en la ruta)
const crearTarea = async (req, res) => {
    try {
        const { title, description, dueDate, priority, project, assignedToEmail, attachments } = req.body;

        // "project" puede venir como ID crudo o como objeto populado ({_id, name, color});
        // es opcional — una tarea sin proyecto asignado es válida (aparece solo en "Todas").
        const proyecto = project && typeof project === 'object' ? project._id : (project || null);

        let assignedTo = null;
        if (assignedToEmail) {
            const miembroAsignado = await User.findOne({ email: assignedToEmail.toLowerCase().trim() });
            if (!miembroAsignado) {
                return res.status(404).json({ mensaje: 'No existe ningún usuario con ese email' });
            }
            const membresia = await Membership.findOne({ org: req.orgId, user: miembroAsignado._id });
            if (!membresia) {
                return res.status(400).json({ mensaje: 'Ese email no pertenece a nadie de tu organización' });
            }
            assignedTo = miembroAsignado._id;
        }

        const nuevaTarea = new Task({
            title,
            description,
            dueDate,
            priority,
            project: proyecto,
            assignedTo,
            attachments: attachments || [],
            user: req.user.id,
            org: req.orgId
        });

        await nuevaTarea.save();
        // El modal de "tarea enviada" necesita el nombre de la persona asignada, no solo su ID.
        await nuevaTarea.populate('assignedTo', 'name lastname email');
        res.status(201).json({ mensaje: '✅ Tarea creada con éxito', tarea: nuevaTarea });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: '❌ Error al crear la tarea', error: error.message });
    }
};

// 2. Obtener tareas de la organización (con filtro opcional por proyecto, o solo las propias)
const obtenerTareas = async (req, res) => {
    try {
        const filtro = { org: req.orgId };
        if (req.query.project) {
            filtro.project = req.query.project;
        }
        if (req.query.mine === 'true') {
            filtro.assignedTo = req.user.id;
        }

        const tareas = await Task.find(filtro)
            .populate('user', 'name lastname email')
            .populate('assignedTo', 'name lastname email')
            .populate('project', 'name color')
            .sort({ dueDate: 1 });

        res.status(200).json(tareas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener las tareas', error: error.message });
    }
};

// 3. Estadísticas de tareas de la organización (o solo las propias, con ?mine=true)
const obtenerEstadisticasTareas = async (req, res) => {
    try {
        const ahora = new Date();
        const hace7dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);

        const base = { org: req.orgId };
        if (req.query.mine === 'true') {
            base.assignedTo = req.user.id;
        }

        const [totalCompleted, completedThisWeek, missedCount] = await Promise.all([
            Task.countDocuments({ ...base, completed: true }),
            Task.countDocuments({ ...base, completed: true, completedAt: { $gte: hace7dias } }),
            Task.countDocuments({ ...base, completed: false, dueDate: { $lt: ahora } })
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
            { completed: false, completedAt: null, pendingReview: false }
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

// 6. Actualizar tarea (cualquier miembro de la organización; confirmar/reabrir es solo admin)
const actualizarTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, dueDate, completed, pendingReview, inProgress, extensionRequested, extensionReason, extensionProposedDate, qualityLevel, completionComment, project, priority, assignedToEmail, attachments } = req.body;

        const tarea = await Task.findOne({ _id: id, org: req.orgId });
        if (!tarea) {
            return res.status(404).json({ mensaje: 'La tarea no existe en esta organización 🛑' });
        }

        // Campos que cualquier miembro puede editar libremente
        if (title !== undefined) tarea.title = title;
        if (description !== undefined) tarea.description = description;
        if (project !== undefined) tarea.project = project && typeof project === 'object' ? project._id : (project || null);
        if (priority !== undefined) tarea.priority = priority;
        if (attachments !== undefined) tarea.attachments = attachments;

        if (assignedToEmail !== undefined) {
            if (!assignedToEmail) {
                tarea.assignedTo = null;
            } else {
                const miembroAsignado = await User.findOne({ email: assignedToEmail.toLowerCase().trim() });
                const membresia = miembroAsignado && await Membership.findOne({ org: req.orgId, user: miembroAsignado._id });
                if (!miembroAsignado || !membresia) {
                    return res.status(400).json({ mensaje: 'Ese email no pertenece a nadie de tu organización' });
                }
                tarea.assignedTo = miembroAsignado._id;
            }
        }

        // Cambiar la fecha límite es cosa de la empresa (sobre todo para reprogramar una
        // tarea vencida). Comparamos contra el valor guardado para no bloquear guardados
        // normales que reenvían la misma fecha sin intención de cambiarla.
        const fechaNueva = dueDate !== undefined ? (dueDate ? new Date(dueDate).toISOString() : null) : undefined;
        const fechaActual = tarea.dueDate ? tarea.dueDate.toISOString() : null;
        if (fechaNueva !== undefined && fechaNueva !== fechaActual) {
            const solicitante = await User.findById(req.user.id).select('accountType');
            if (!solicitante || solicitante.accountType !== 'empresa') {
                return res.status(403).json({ mensaje: 'Solo una cuenta de empresa puede reprogramar la fecha límite 🛑' });
            }
            tarea.dueDate = dueDate;
            tarea.extensionRequested = false;
            tarea.extensionReason = '';
            tarea.extensionProposedDate = null;
        }

        // "completed" solo lo puede tocar una cuenta de empresa: confirma (true) o reabre (false) una tarea.
        // Comparamos contra el valor guardado para no bloquear guardados normales que
        // reenvían el mismo valor de "completed" sin intención de cambiarlo.
        if (completed !== undefined && completed !== tarea.completed) {
            const solicitante = await User.findById(req.user.id).select('accountType');
            if (!solicitante || solicitante.accountType !== 'empresa') {
                return res.status(403).json({ mensaje: 'Solo una cuenta de empresa puede confirmar o reabrir una tarea 🛑' });
            }
            tarea.completed = completed;
            tarea.completedAt = completed ? new Date() : null;
            tarea.pendingReview = false;
            tarea.inProgress = false;
            if (completed) {
                tarea.qualityLevel = qualityLevel || null;
                tarea.completionComment = completionComment || '';
            } else {
                tarea.qualityLevel = null;
                tarea.completionComment = '';
            }
        } else if (pendingReview !== undefined && pendingReview !== tarea.pendingReview) {
            // Marcarla como lista (false→true) es cosa de la persona asignada. Pero una vez
            // enviada, deshacerlo (true→false) ya no depende de ella — solo la empresa puede
            // destrabarla (confirmándola o reabriéndola), así nadie "retira" un envío a mitad de revisión.
            const esAsignatario = tarea.assignedTo && tarea.assignedTo.equals(req.user.id);
            const solicitante = await User.findById(req.user.id).select('accountType');
            const esEmpresaSolicitante = solicitante?.accountType === 'empresa';

            if (pendingReview) {
                if (!esAsignatario && !esEmpresaSolicitante) {
                    return res.status(403).json({ mensaje: 'Solo la persona asignada puede marcar esta tarea como lista 🛑' });
                }
            } else if (!esEmpresaSolicitante) {
                return res.status(403).json({ mensaje: 'Solo una cuenta de empresa puede confirmar o reabrir una tarea 🛑' });
            }
            tarea.pendingReview = pendingReview;
            if (pendingReview) tarea.inProgress = false;
        } else if (inProgress !== undefined && inProgress !== tarea.inProgress) {
            // "Empecé a trabajar en esto" — solo un indicador personal, lo puede
            // tocar la persona asignada (o la empresa, como con todo lo demás).
            const esAsignatario = tarea.assignedTo && tarea.assignedTo.equals(req.user.id);
            if (!esAsignatario) {
                const solicitante = await User.findById(req.user.id).select('accountType');
                if (!solicitante || solicitante.accountType !== 'empresa') {
                    return res.status(403).json({ mensaje: 'Solo la persona asignada puede marcar esta tarea como en progreso 🛑' });
                }
            }
            tarea.inProgress = inProgress;
        } else if (extensionRequested !== undefined && extensionRequested !== tarea.extensionRequested) {
            // Solo la persona asignada puede pedir más tiempo, y solo si la tarea está vencida.
            const esAsignatario = tarea.assignedTo && tarea.assignedTo.equals(req.user.id);
            if (!esAsignatario) {
                return res.status(403).json({ mensaje: 'Solo la persona asignada puede solicitar una extensión 🛑' });
            }
            const estaVencida = !tarea.completed && tarea.dueDate && tarea.dueDate < new Date();
            if (!estaVencida) {
                return res.status(400).json({ mensaje: 'Solo se puede solicitar una extensión en una tarea vencida 🛑' });
            }
            tarea.extensionRequested = extensionRequested;
            if (extensionRequested) {
                tarea.extensionReason = extensionReason || '';
                tarea.extensionProposedDate = extensionProposedDate || null;
            } else {
                tarea.extensionReason = '';
                tarea.extensionProposedDate = null;
            }
        }

        await tarea.save();

        res.status(200).json({ mensaje: '✏️ Tarea actualizada con éxito', tarea });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar la tarea', error: error.message });
    }
};

// 7. Borrar tarea (solo cuenta empresa — ningún empleado puede borrar tareas, ni siquiera las propias)
const borrarTarea = async (req, res) => {
    try {
        const { id } = req.params;

        const tarea = await Task.findOne({ _id: id, org: req.orgId });
        if (!tarea) {
            return res.status(404).json({ mensaje: 'La tarea no existe en esta organización 🛑' });
        }

        const solicitante = await User.findById(req.user.id).select('accountType');
        if (!solicitante || solicitante.accountType !== 'empresa') {
            return res.status(403).json({ mensaje: 'Solo una cuenta de empresa puede eliminar tareas 🛑' });
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
