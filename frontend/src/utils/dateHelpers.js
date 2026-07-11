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
