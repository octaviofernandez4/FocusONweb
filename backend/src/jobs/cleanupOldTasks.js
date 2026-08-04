const Task = require('../models/Task');
const User = require('../models/User');

const TREINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000;
const UN_DIA_MS = 24 * 60 * 60 * 1000;

// Reemplaza el botón manual "Limpiar todas": una tarea completada o vencida
// con más de 30 días de antigüedad se borra sola, sin que nadie tenga que
// entrar a limpiarla a mano.
const limpiarTareasAntiguas = async () => {
    const limite = new Date(Date.now() - TREINTA_DIAS_MS);
    try {
        const filtro = {
            $or: [
                { completed: true, completedAt: { $lt: limite } },
                { completed: false, dueDate: { $lt: limite } }
            ]
        };

        // Necesitamos los IDs de antemano (no solo el conteo) para poder limpiar
        // las notificaciones descartadas que apuntan a estas tareas.
        const tareasAEliminar = await Task.find(filtro).select('_id');
        if (tareasAEliminar.length === 0) return;

        const ids = tareasAEliminar.map((t) => t._id);
        await Task.deleteMany({ _id: { $in: ids } });
        await User.updateMany(
            { dismissedNotifications: { $in: ids } },
            { $pull: { dismissedNotifications: { $in: ids } } }
        );

        console.log(`🧹 Limpieza automática: se borraron ${ids.length} tarea(s) con más de 30 días.`);
    } catch (error) {
        console.error('Error en la limpieza automática de tareas:', error);
    }
};

// Corre una vez al levantar el servidor y después una vez por día.
const iniciarLimpiezaAutomatica = () => {
    limpiarTareasAntiguas();
    setInterval(limpiarTareasAntiguas, UN_DIA_MS);
};

module.exports = { iniciarLimpiezaAutomatica, limpiarTareasAntiguas };
