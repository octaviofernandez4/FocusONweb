export const formatRelativo = (fecha) => {
  if (!fecha) return '';
  const minutos = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  return `Hace ${Math.floor(horas / 24)} d`;
};

// Las notificaciones se arman con datos reales de tareas (no hay mensajería/menciones
// en la app todavía), separadas según lo que le corresponde ver a cada tipo de cuenta.
export const construirNotificaciones = (tasks, user, esEmpresa) => {
  if (esEmpresa) {
    const nuevas = tasks
      .filter((t) => t.pendingReview && !t.completed)
      .map((t) => ({
        id: t._id,
        task: t,
        title: 'Tarea lista para confirmar',
        text: `"${t.title}" está esperando tu confirmación${t.assignedTo?.name ? ` de ${t.assignedTo.name}` : ''}.`,
        time: t.updatedAt
      }))
      .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
    const anteriores = tasks
      .filter((t) => t.completed)
      .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))
      .slice(0, 8)
      .map((t) => ({
        id: t._id,
        task: t,
        title: 'Tarea confirmada',
        text: `Confirmaste la tarea "${t.title}".`,
        time: t.completedAt
      }));
    return { nuevas, anteriores };
  }

  const misTareas = tasks.filter((t) => String(t.assignedTo?._id || t.assignedTo) === String(user?._id));
  const nuevas = misTareas
    .filter((t) => !t.completed && !t.pendingReview)
    .map((t) => ({
      id: t._id,
      task: t,
      title: 'Nueva tarea asignada',
      text: `Se te asignó "${t.title}"${t.dueDate ? `. La fecha límite es ${new Date(t.dueDate).toLocaleDateString('es-AR')}` : ''}.`,
      time: t.createdAt
    }))
    .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  const anteriores = misTareas
    .filter((t) => t.completed)
    .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))
    .slice(0, 8)
    .map((t) => ({
      id: t._id,
      task: t,
      title: 'Tarea confirmada',
      text: `Tu tarea "${t.title}" fue confirmada.`,
      time: t.completedAt
    }));
  return { nuevas, anteriores };
};
