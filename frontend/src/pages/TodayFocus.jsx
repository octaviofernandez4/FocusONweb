import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getTasks, createTask, updateTask, deleteTask } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { isTodayRelevant } from '../utils/dateHelpers';
import { canDeleteTask } from '../utils/taskPermissions';
import ProgressBar from '../components/ProgressBar';
import NewTaskInput from '../components/NewTaskInput';
import TaskCard from '../components/TaskCard';
import './TodayFocus.css';

const TodayFocus = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { isAdmin } = useOrg();

  const cargarTareas = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarTareas();
  }, [cargarTareas]);

  const tareasDeHoy = tasks.filter(isTodayRelevant);
  const completadas = tareasDeHoy.filter((t) => t.completed).length;

  const handleCreate = async ({ title, dueDate }) => {
    try {
      await createTask({ title, dueDate: dueDate ? new Date(dueDate).toISOString() : undefined });
      await cargarTareas();
    } catch (error) {
      console.error(error);
      alert('Hubo un error al crear la tarea');
    }
  };

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
    <div className="today-focus">
      <h1>Enfoque de hoy</h1>
      <p className="page-subtitle">Mantené el foco. Completá lo esencial de hoy.</p>

      <ProgressBar total={tareasDeHoy.length} done={completadas} />
      <NewTaskInput onCreate={handleCreate} />

      {isLoading ? (
        <p className="empty-state">Cargando tareas…</p>
      ) : tareasDeHoy.length === 0 ? (
        <p className="empty-state">No hay tareas para hoy. ¡Agregá la primera!</p>
      ) : (
        <div className="today-grid">
          {tareasDeHoy.map((task, i) => (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
            >
              <TaskCard
                task={task}
                onDelete={handleDelete}
                onToggleComplete={handleToggle}
                canDelete={canDeleteTask(task, user?._id, isAdmin)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodayFocus;
