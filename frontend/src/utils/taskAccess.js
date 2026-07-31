import { isMissed } from './dateHelpers';

export const ESTADO_LABEL = { pending: 'Pendiente', progress: 'En progreso', review: 'En revisión', completed: 'Completada' };
export const PRIORIDAD_LABEL = { high: 'ALTA', medium: 'MEDIA', low: 'BAJA' };

// Estado de una tarea: 'completed' (confirmada por la empresa), 'review' (el empleado la
// mandó a revisión, esperando confirmación), 'progress' (el empleado ya empezó pero
// todavía no la mandó) o 'pending' (todavía sin tocar).
export const getEstado = (task) => {
  if (task.completed) return 'completed';
  if (task.pendingReview) return 'review';
  if (task.inProgress) return 'progress';
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

  // Una vez vencida, el asignado ya no puede marcarla como lista (para eso está
  // "solicitar extensión" en Incompletas) — la empresa sigue pudiendo confirmarla/reabrirla.
  const vencida = isMissed(task);
  const puedeTocarCheck = esEmpresa || (esAsignatario && estado !== 'completed' && !vencida);
  const puedeBorrar = esEmpresa;
  // "Reabrir tarea" aplica tanto a una ya confirmada como a una vencida sin completar
  // (en los dos casos hace falta pedir un motivo y una fecha nueva, no un simple toggle).
  const esReapertura = estado === 'completed' || vencida;
  const tituloBoton = esEmpresa
    ? (esReapertura ? 'Reabrir tarea' : 'Confirmar tarea')
    : (estado === 'review' ? 'Deshacer' : 'Marcar como lista');

  return { estado, esEmpresa, esAsignatario, puedeTocarCheck, puedeBorrar, esReapertura, tituloBoton };
};
