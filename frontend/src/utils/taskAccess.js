export const ESTADO_LABEL = { pending: 'Pendiente', review: 'En revisión', completed: 'Completada' };
export const PRIORIDAD_LABEL = { high: 'ALTA', medium: 'MEDIA', low: 'BAJA' };

// Estado de una tarea: 'completed' (confirmada por la empresa), 'review' (el empleado la
// marcó como lista, esperando confirmación) o 'pending' (todavía sin marcar).
export const getEstado = (task) => {
  if (task.completed) return 'completed';
  if (task.pendingReview) return 'review';
  return 'pending';
};

// Reglas de permisos sobre una tarea (reflejan lo que el backend ya exige):
// solo la cuenta empresa confirma/reabre/borra tareas; un empleado solo puede
// marcar como lista (o deshacerlo) la tarea que tiene asignada a él mismo, y
// nunca una tarea ajena ni una ya confirmada.
export const getTaskAccess = (task, user) => {
  const esEmpresa = user?.accountType === 'empresa';
  const esAsignatario = String(task.assignedTo?._id || task.assignedTo) === String(user?._id);
  const estado = getEstado(task);

  const puedeTocarCheck = esEmpresa || (esAsignatario && estado !== 'completed');
  const puedeBorrar = esEmpresa;
  const tituloBoton = esEmpresa
    ? (estado === 'completed' ? 'Reabrir tarea' : 'Confirmar tarea')
    : (estado === 'review' ? 'Deshacer' : 'Marcar como lista');

  return { estado, esEmpresa, esAsignatario, puedeTocarCheck, puedeBorrar, tituloBoton };
};
