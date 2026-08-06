const Task = require('../models/Task');
const Membership = require('../models/Membership');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Project = require('../models/Project');
const { enviarEmailTareaAsignada, enviarEmailAclaracionSolicitada, enviarEmailAclaracionRespondida } = require('../utils/mailer');
const { detalleError } = require('../utils/errorResponse');

// La contraseña de aplicación de Gmail tiene select:false en el modelo — hay
// que pedirla explícitamente con "+" para poder armar el transporter del mail.
const buscarOrgParaNotificar = (orgId) =>
    Organization.findById(orgId).select('name notificationEmail +notificationEmailAppPasswordEnc');

// Las fechas límite se guardan en UTC pero representan "fin del día en Argentina"
// (ver NewTaskModal.jsx en el frontend, que arma el dueDate con T23:59:59 hora
// local). Por eso "vencida" acá se evalúa contra el INICIO del día de hoy en
// Argentina, no contra el instante exacto — así una tarea con vencimiento hoy
// no cuenta como perdida antes de medianoche, sin importar a qué hora del día
// haya quedado guardada (ej. tareas viejas sin fin de día 23:59:59).
const OFFSET_ARGENTINA_MS = 3 * 60 * 60 * 1000; // UTC-3, Argentina no tiene horario de verano
const inicioDeHoyArgentina = () => {
    const ahoraDesplazado = new Date(Date.now() - OFFSET_ARGENTINA_MS);
    const medianocheDesplazada = Date.UTC(
        ahoraDesplazado.getUTCFullYear(),
        ahoraDesplazado.getUTCMonth(),
        ahoraDesplazado.getUTCDate()
    );
    return new Date(medianocheDesplazada + OFFSET_ARGENTINA_MS);
};

// 1. Crear tarea (solo cuenta empresa, ver requireCompanyAccount en la ruta)
const crearTarea = async (req, res) => {
    try {
        const { title, description, dueDate, priority, estimatedHours, project, assignedToEmail, attachments } = req.body;

        // "project" puede venir como ID crudo o como objeto populado ({_id, name, color});
        // es opcional — una tarea sin proyecto asignado es válida (aparece solo en "Todas").
        const proyecto = project && typeof project === 'object' ? project._id : (project || null);
        if (proyecto) {
            const proyectoValido = await Project.exists({ _id: proyecto, org: req.orgId });
            if (!proyectoValido) {
                return res.status(400).json({ mensaje: 'Ese proyecto no pertenece a tu organización 🛑' });
            }
        }

        let assignedTo = null;
        let miembroAsignado = null;
        if (assignedToEmail) {
            miembroAsignado = await User.findOne({ email: assignedToEmail.toLowerCase().trim() });
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
            estimatedHours: estimatedHours || null,
            project: proyecto,
            assignedTo,
            attachments: attachments || [],
            user: req.user.id,
            org: req.orgId
        });

        await nuevaTarea.save();
        // El modal de "tarea enviada" necesita el nombre de la persona asignada, no solo su ID.
        await nuevaTarea.populate('assignedTo', 'name lastname email');

        if (miembroAsignado) {
            const organizacion = await buscarOrgParaNotificar(req.orgId);
            enviarEmailTareaAsignada({
                org: organizacion,
                destinatario: miembroAsignado.email,
                nombreDestinatario: miembroAsignado.name,
                tituloTarea: nuevaTarea.title
            });
        }

        res.status(201).json({ mensaje: '✅ Tarea creada con éxito', tarea: nuevaTarea });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: '❌ Error al crear la tarea', error: detalleError(error) });
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
        res.status(500).json({ mensaje: 'Error al obtener las tareas', error: detalleError(error) });
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
            Task.countDocuments({ ...base, completed: false, dueDate: { $lt: inicioDeHoyArgentina() } })
        ]);

        const totalConsiderado = totalCompleted + missedCount;
        const completionRate = totalConsiderado === 0 ? 0 : Math.round((totalCompleted / totalConsiderado) * 100);

        res.status(200).json({ totalCompleted, completedThisWeek, missedCount, completionRate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener las estadísticas', error: detalleError(error) });
    }
};

// 4. Actualizar tarea (cualquier miembro de la organización; confirmar/reabrir es solo admin)
const actualizarTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, dueDate, completed, pendingReview, inProgress, extensionRequested, extensionReason, extensionProposedDate, qualityLevel, completionComment, project, priority, estimatedHours, assignedToEmail, attachments, clarificationRequested, clarificationQuestion, clarificationAnswer } = req.body;

        const tarea = await Task.findOne({ _id: id, org: req.orgId });
        if (!tarea) {
            return res.status(404).json({ mensaje: 'La tarea no existe en esta organización 🛑' });
        }

        // Campos que cualquier miembro puede editar libremente
        if (title !== undefined) tarea.title = title;
        if (description !== undefined) tarea.description = description;
        if (estimatedHours !== undefined) tarea.estimatedHours = estimatedHours || null;
        if (project !== undefined) {
            const proyectoId = project && typeof project === 'object' ? project._id : (project || null);
            if (proyectoId) {
                const proyectoValido = await Project.exists({ _id: proyectoId, org: req.orgId });
                if (!proyectoValido) {
                    return res.status(400).json({ mensaje: 'Ese proyecto no pertenece a tu organización 🛑' });
                }
            }
            tarea.project = proyectoId;
        }
        if (priority !== undefined) tarea.priority = priority;
        if (attachments !== undefined) tarea.attachments = attachments;

        const assignedToAnterior = tarea.assignedTo ? String(tarea.assignedTo) : null;
        let miembroReasignado = null;
        let huboSolicitudDeAclaracion = false;
        let huboRespuestaDeAclaracion = false;
        if (assignedToEmail !== undefined) {
            if (!assignedToEmail) {
                tarea.assignedTo = null;
            } else {
                miembroReasignado = await User.findOne({ email: assignedToEmail.toLowerCase().trim() });
                const membresia = miembroReasignado && await Membership.findOne({ org: req.orgId, user: miembroReasignado._id });
                if (!miembroReasignado || !membresia) {
                    return res.status(400).json({ mensaje: 'Ese email no pertenece a nadie de tu organización' });
                }
                tarea.assignedTo = miembroReasignado._id;
            }
        }

        // Guardamos el valor ORIGINAL antes de que la rama de dueDate (acá abajo) lo
        // pueda resetear a false — si no, la comparación de la rama de extensionRequested
        // más abajo lo compara contra el valor ya mutado y dispara por error el 403 de
        // "solo el asignado puede pedir extensión" cuando la empresa reprograma la fecha
        // de una tarea que tenía una extensión pedida (el payload reenvía el true viejo).
        const extensionRequestedOriginal = tarea.extensionRequested;

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
        } else if (extensionRequested !== undefined && extensionRequested !== extensionRequestedOriginal) {
            // Solo la persona asignada puede pedir más tiempo, y solo si la tarea está vencida.
            const esAsignatario = tarea.assignedTo && tarea.assignedTo.equals(req.user.id);
            if (!esAsignatario) {
                return res.status(403).json({ mensaje: 'Solo la persona asignada puede solicitar una extensión 🛑' });
            }
            const estaVencida = !tarea.completed && tarea.dueDate && tarea.dueDate < inicioDeHoyArgentina();
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
        } else if (clarificationRequested !== undefined && clarificationRequested !== tarea.clarificationRequested) {
            // Pedir una aclaración es cosa de la empresa (mismo criterio que aprobar/reabrir).
            const solicitante = await User.findById(req.user.id).select('accountType');
            if (!solicitante || solicitante.accountType !== 'empresa') {
                return res.status(403).json({ mensaje: 'Solo una cuenta de empresa puede solicitar una aclaración 🛑' });
            }
            if (clarificationRequested) {
                if (!clarificationQuestion || !clarificationQuestion.trim()) {
                    return res.status(400).json({ mensaje: 'Escribí la pregunta o comentario para la aclaración 🛑' });
                }
                tarea.clarificationRequested = true;
                tarea.clarificationQuestion = clarificationQuestion.trim();
                tarea.clarificationRequestedAt = new Date();
                tarea.clarificationAnswer = '';
                tarea.clarificationAnsweredAt = null;
                huboSolicitudDeAclaracion = true;
            } else {
                tarea.clarificationRequested = false;
            }
        } else if (clarificationAnswer !== undefined && clarificationAnswer.trim() && tarea.clarificationRequested) {
            // Solo la persona asignada puede responder, y solo si hay un pedido activo.
            const esAsignatario = tarea.assignedTo && tarea.assignedTo.equals(req.user.id);
            if (!esAsignatario) {
                return res.status(403).json({ mensaje: 'Solo la persona asignada puede responder la aclaración 🛑' });
            }
            tarea.clarificationAnswer = clarificationAnswer.trim();
            tarea.clarificationAnsweredAt = new Date();
            tarea.clarificationRequested = false;
            huboRespuestaDeAclaracion = true;
        }

        await tarea.save();

        // Solo avisamos si la tarea pasó a estar asignada a otra persona distinta
        // de quien la tenía antes (no en cada guardado que reenvía el mismo email).
        if (miembroReasignado && String(miembroReasignado._id) !== assignedToAnterior) {
            const organizacion = await buscarOrgParaNotificar(req.orgId);
            enviarEmailTareaAsignada({
                org: organizacion,
                destinatario: miembroReasignado.email,
                nombreDestinatario: miembroReasignado.name,
                tituloTarea: tarea.title
            });
        }

        if (huboSolicitudDeAclaracion && tarea.assignedTo) {
            const asignado = await User.findById(tarea.assignedTo).select('name email');
            if (asignado) {
                const organizacion = await buscarOrgParaNotificar(req.orgId);
                enviarEmailAclaracionSolicitada({
                    org: organizacion,
                    destinatario: asignado.email,
                    nombreDestinatario: asignado.name,
                    tituloTarea: tarea.title,
                    pregunta: tarea.clarificationQuestion
                });
            }
        }

        if (huboRespuestaDeAclaracion) {
            const creador = await User.findById(tarea.user).select('name email');
            if (creador) {
                const organizacion = await buscarOrgParaNotificar(req.orgId);
                enviarEmailAclaracionRespondida({
                    org: organizacion,
                    destinatario: creador.email,
                    nombreDestinatario: creador.name,
                    tituloTarea: tarea.title,
                    respuesta: tarea.clarificationAnswer
                });
            }
        }

        res.status(200).json({ mensaje: '✏️ Tarea actualizada con éxito', tarea });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar la tarea', error: detalleError(error) });
    }
};

// 5. Borrar tarea (solo cuenta empresa — ningún empleado puede borrar tareas, ni siquiera las propias)
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

        // Si alguien la había descartado de sus notificaciones, ese ID queda
        // guardado para siempre si no se limpia acá — la tarea ya no existe.
        await User.updateMany(
            { dismissedNotifications: tarea._id },
            { $pull: { dismissedNotifications: tarea._id } }
        );

        res.status(200).json({ mensaje: '🗑️ Tarea eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al borrar la tarea', error: detalleError(error) });
    }
};

module.exports = {
    crearTarea,
    obtenerTareas,
    obtenerEstadisticasTareas,
    actualizarTarea,
    borrarTarea
};
