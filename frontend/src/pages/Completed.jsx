import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { getTasks, getTaskStats, restoreAllTasks, clearAllCompletedTasks } from '../services/taskService';
import { useOrg } from '../hooks/useOrg';
import { isSameLocalDay } from '../utils/dateHelpers';
import StatCard from '../components/StatCard';
import CompletedTaskRow from '../components/CompletedTaskRow';
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
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const { isAdmin } = useOrg();

  const cargarDatos = useCallback(async () => {
    try {
      const [tareas, estadisticas] = await Promise.all([getTasks(), getTaskStats()]);
      setTasks(tareas);
      setStats(estadisticas);
    } catch (error) {
      console.error('Error al cargar completadas:', error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos();
  }, [cargarDatos]);

  const ahora = new Date();
  const relevantes = tasks
    .filter((t) => t.completed || (t.dueDate && new Date(t.dueDate) < ahora))
    .map((t) => ({
      task: t,
      isMissed: !t.completed,
      fechaOrden: t.completed ? t.completedAt : t.dueDate,
    }))
    .sort((a, b) => new Date(b.fechaOrden) - new Date(a.fechaOrden));

  const grupos = relevantes.reduce((acc, item) => {
    const label = groupLabel(item.fechaOrden);
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {});

  const handleRestoreAll = async () => {
    try {
      await restoreAllTasks();
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert('Hubo un error al restaurar las tareas');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('¿Borrar definitivamente todas las tareas completadas y perdidas?')) return;
    try {
      await clearAllCompletedTasks();
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al limpiar las tareas');
    }
  };

  return (
    <div className="completed-page">
      <div className="completed-header">
        <div>
          <h1>Completadas</h1>
          <p className="page-subtitle">Revisá tus tareas terminadas y perdidas.</p>
        </div>
        <div className="completed-header-actions">
          <button className="btn-ghost" onClick={handleRestoreAll}>
            <RotateCcw size={16} /> Restaurar todas
          </button>
          {isAdmin && (
            <button className="btn-ghost" onClick={handleClearAll}>
              <Trash2 size={16} /> Limpiar todas
            </button>
          )}
        </div>
      </div>

      {stats && (
        <div className="completed-stats">
          <StatCard label="TOTAL COMPLETADAS" value={stats.totalCompleted} hint={`+${stats.completedThisWeek} esta semana`} tone="neutral" />
          <StatCard label="TASA DE CUMPLIMIENTO" value={`${stats.completionRate}%`} hint="Buen trabajo manteniendo el foco." tone="success" />
          <StatCard label="PERDIDAS" value={stats.missedCount} hint="Requieren atención o reprogramación." tone="danger" />
        </div>
      )}

      {relevantes.length === 0 ? (
        <p className="empty-state">Todavía no hay tareas completadas o perdidas.</p>
      ) : (
        Object.entries(grupos).map(([label, items]) => (
          <div key={label} className="completed-group">
            <h2>{label}</h2>
            {items.map(({ task, isMissed }) => (
              <CompletedTaskRow key={task._id} task={task} isMissed={isMissed} />
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default Completed;
