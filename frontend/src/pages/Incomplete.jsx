import { useState, useEffect, useCallback } from 'react';
import { getTasks, getTaskStats, updateTask } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import { isSameLocalDay, isMissed } from '../utils/dateHelpers';
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

// "Incompletas" — tareas vencidas sin completar, separadas de "Completadas".
// El asignado puede pedir más tiempo; la empresa puede ponerle una nueva fecha.
const Incomplete = () => {
  const { user } = useAuth();
  const esEmpresa = user?.accountType === 'empresa';
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [soloConExtension, setSoloConExtension] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const opciones = esEmpresa ? {} : { mine: true };
      const [tareas, estadisticas] = await Promise.all([getTasks(opciones), getTaskStats(opciones)]);
      setTasks(tareas);
      setStats(estadisticas);
    } catch (error) {
      console.error('Error al cargar incompletas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [esEmpresa]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos();
  }, [cargarDatos]);

  const todasIncompletas = tasks.filter(isMissed).sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
  const pidieronExtension = todasIncompletas.filter((t) => t.extensionRequested).length;
  const incompletas = soloConExtension ? todasIncompletas.filter((t) => t.extensionRequested) : todasIncompletas;

  const grupos = incompletas.reduce((acc, task) => {
    const label = groupLabel(task.dueDate);
    if (!acc[label]) acc[label] = [];
    acc[label].push(task);
    return acc;
  }, {});

  const handleRequestExtension = async (task, { motivo, fechaPropuesta }) => {
    try {
      await updateTask(task._id, {
        ...task,
        extensionRequested: true,
        extensionReason: motivo,
        extensionProposedDate: fechaPropuesta,
      });
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al solicitar la extensión');
    }
  };

  const handleReschedule = async (task, nuevaFechaISO) => {
    try {
      await updateTask(task._id, { ...task, dueDate: nuevaFechaISO });
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al reprogramar la tarea');
    }
  };

  return (
    <div className="completed-page">
      <div className="completed-header">
        <div>
          <h1>Incompletas</h1>
          <p className="page-subtitle">Tareas vencidas que todavía no se completaron.</p>
        </div>
      </div>

      {stats && (
        <div className="completed-stats">
          <StatCard
            label="TAREAS INCOMPLETAS"
            value={todasIncompletas.length}
            hint="Vencidas y sin resolver."
            tone="danger"
            onClick={() => setSoloConExtension(false)}
            isActive={!soloConExtension}
          />
          <StatCard label="TASA DE CUMPLIMIENTO" value={`${stats.completionRate}%`} hint="Completadas vs. perdidas." tone="success" />
          {esEmpresa && (
            <StatCard
              label="PIDIERON EXTENSIÓN"
              value={pidieronExtension}
              hint="Esperando que les pongas una nueva fecha."
              tone="neutral"
              onClick={() => setSoloConExtension((prev) => !prev)}
              isActive={soloConExtension}
            />
          )}
        </div>
      )}

      {isLoading ? (
        <p className="empty-state">Cargando tareas vencidas…</p>
      ) : incompletas.length === 0 ? (
        <p className="empty-state">
          {soloConExtension ? 'Nadie pidió extensión todavía.' : 'No tenés tareas vencidas. 🎉'}
        </p>
      ) : (
        Object.entries(grupos).map(([label, items]) => (
          <div key={label} className="completed-group">
            <h2>{label}</h2>
            {items.map((task) => (
              <TaskHistoryRow
                key={task._id}
                task={task}
                onRequestExtension={handleRequestExtension}
                onReschedule={handleReschedule}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default Incomplete;
