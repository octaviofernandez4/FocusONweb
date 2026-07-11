import { useState, useEffect, useCallback } from 'react';
import { getTasks, updateTask, deleteTask } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { canDeleteTask } from '../utils/taskPermissions';
import TaskCard from '../components/TaskCard';
import './Inbox.css';

const Inbox = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { isAdmin } = useOrg();

  const cargarTareas = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error al cargar la bandeja:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarTareas();
  }, [cargarTareas]);

  const pendientes = tasks.filter((t) => !t.completed);

  const handleToggle = async (task) => {
    try {
      await updateTask(task._id, { ...task, completed: !task.completed });
      await cargarTareas();
    } catch (error) {
      console.error(error);
      alert('Hubo un error al actualizar la tarea');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      await cargarTareas();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al eliminar la tarea');
    }
  };

  return (
    <div className="inbox-page">
      <h1>Bandeja</h1>
      <p className="page-subtitle">Todas las tareas pendientes del equipo, sin importar la fecha.</p>

      {isLoading ? (
        <p className="empty-state">Cargando tareas…</p>
      ) : pendientes.length === 0 ? (
        <p className="empty-state">No hay tareas pendientes. ¡Al día! 🎉</p>
      ) : (
        <div className="inbox-grid">
          {pendientes.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onDelete={handleDelete}
              onToggleComplete={handleToggle}
              canDelete={canDeleteTask(task, user?._id, isAdmin)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Inbox;
