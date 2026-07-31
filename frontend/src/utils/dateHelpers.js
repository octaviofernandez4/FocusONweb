export const isSameLocalDay = (a, b) => {
  const dateA = new Date(a);
  const dateB = new Date(b);
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
};

export const endOfToday = () => {
  const fin = new Date();
  fin.setHours(23, 59, 59, 999);
  return fin;
};

// Tareas "de hoy": pendientes sin fecha, pendientes vencidas/de hoy, o completadas hoy.
export const isTodayRelevant = (task) => {
  if (task.completed) {
    return task.completedAt ? isSameLocalDay(task.completedAt, new Date()) : false;
  }
  if (!task.dueDate) return true;
  return new Date(task.dueDate) <= endOfToday();
};

// Tarea "vencida/perdida": sin completar y con fecha límite ya pasada.
export const isMissed = (task) => Boolean(!task.completed && task.dueDate && new Date(task.dueDate) < new Date());

// Valida un input type="date" (YYYY-MM-DD, sin hora) contra el día calendario de
// hoy — así una fecha límite fijada para "hoy mismo" sigue siendo válida.
export const esFechaPasada = (fechaStr) => {
  if (!fechaStr) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  return new Date(anio, mes - 1, dia) < hoy;
};
