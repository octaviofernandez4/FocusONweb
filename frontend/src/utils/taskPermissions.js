// El campo `user` de una tarea a veces viene poblado ({_id, name, ...}) y a veces
// como el ObjectId crudo (ej. justo después de crearla), según qué endpoint respondió.
export const getTaskOwnerId = (task) => task.user?._id || task.user;

export const canDeleteTask = (task, currentUserId, isAdmin) => {
  if (!currentUserId) return false;
  return isAdmin || String(getTaskOwnerId(task)) === String(currentUserId);
};
