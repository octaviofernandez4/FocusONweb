import { useState, useEffect, useCallback } from 'react';
import { getTasks, getTaskStats } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';
import { isSameLocalDay } from '../utils/dateHelpers';
import StatCard from '../components/StatCard';
import TaskHistoryRow from '../components/TaskHistoryRow';
import './Completed.css';

const groupLabel = (fecha) => {
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);

  if (isSameLocalDay(fecha, hoy)) return 'Hoy';
  if (isSameLocalDay(fecha, ayer)) return 'Ayer';
  return new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
};

const Completed = () => {
  usePageTitle('Completadas');
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const esEmpresa = user?.accountType === 'empresa';

  const cargarDatos = useCallback(async () => {
    try {
      const opciones = esEmpresa ? {} : { mine: true };
      const [tareas, estadisticas] = await Promise.all([getTasks(opciones), getTaskStats(opciones)]);
      setTasks(tareas);
      setStats(estadisticas);
    } catch (error) {
      console.error('Error al cargar completadas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [esEmpresa]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos();
  }, [cargarDatos]);

  const completadas = tasks
    .filter((t) => t.completed)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  const grupos = completadas.reduce((acc, task) => {
    const label = groupLabel(task.completedAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(task);
    return acc;
  }, {});

  return (
    <div className="completed-page">
      <div className="completed-header">
        <div>
          <h1>Completadas</h1>
          <p className="page-subtitle">Revisá tus tareas terminadas.</p>
        </div>
      </div>

      {stats && (
        <div className="completed-stats">
          <StatCard label="TOTAL COMPLETADAS" value={stats.totalCompleted} hint={`+${stats.completedThisWeek} esta semana`} tone="neutral" />
          <StatCard label="TASA DE CUMPLIMIENTO" value={`${stats.completionRate}%`} hint="Buen trabajo manteniendo el foco." tone="success" />
        </div>
      )}

      {isLoading ? (
        <p className="empty-state">Cargando tareas completadas…</p>
      ) : completadas.length === 0 ? (
        <p className="empty-state">Todavía no hay tareas completadas.</p>
      ) : (
        Object.entries(grupos).map(([label, items]) => (
          <div key={label} className="completed-group">
            <h2>{label}</h2>
            {items.map((task) => (
              <TaskHistoryRow key={task._id} task={task} />
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default Completed;
