import { useState, useEffect, useCallback, useMemo } from 'react';
import { Check } from 'lucide-react';
import { getTasks, updateTask } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { isTodayRelevant } from '../utils/dateHelpers';
import './MyTasks.css';

const formatFechaHora = (dueDate) => {
  if (!dueDate) return 'Sin fecha';
  return new Date(dueDate).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

// "Mis tareas" — solo la cuenta empleado la ve en el sidebar. Muestra únicamente
// las tareas asignadas a mí; el tilde marca "lista para revisión" (nunca confirma).
const MyTasks = () => {
  const { user } = useAuth();
  const { projects } = useOrg();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vista, setVista] = useState('hoy');

  const cargarTareas = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error al cargar mis tareas:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarTareas();
  }, [cargarTareas]);

  const misTareas = useMemo(
    () => tasks.filter((t) => String(t.assignedTo?._id || t.assignedTo) === String(user?._id)),
    [tasks, user]
  );

  const activas = misTareas.filter((t) => !t.completed);
  const completadas = misTareas.filter((t) => t.completed);
  const visibles = vista === 'hoy' ? activas.filter(isTodayRelevant) : activas.filter((t) => !isTodayRelevant(t));

  const proyectosConProgreso = projects.map((project) => {
    const tareasDelProyecto = tasks.filter((t) => (t.project?._id || t.project) === project._id);
    const completadasProyecto = tareasDelProyecto.filter((t) => t.completed).length;
    const progreso = tareasDelProyecto.length === 0 ? 0 : Math.round((completadasProyecto / tareasDelProyecto.length) * 100);
    return { ...project, progreso };
  });

  const handleToggle = async (task) => {
    try {
      await updateTask(task._id, { ...task, pendingReview: !task.pendingReview });
      await cargarTareas();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al actualizar la tarea');
    }
  };

  return (
    <div className="mytasks-page">
      <h1>Mis tareas</h1>
      <p className="page-subtitle">Las tareas que tenés asignadas, agrupadas por fecha.</p>

      <div className="mytasks-body">
        <div className="mytasks-main card-panel">
          <div className="mytasks-tabs">
            <button className={`mytasks-tab ${vista === 'hoy' ? 'is-active' : ''}`} onClick={() => setVista('hoy')}>Hoy</button>
            <button className={`mytasks-tab ${vista === 'proximas' ? 'is-active' : ''}`} onClick={() => setVista('proximas')}>Próximas</button>
          </div>

          {isLoading ? (
            <p className="empty-state">Cargando tareas…</p>
          ) : visibles.length === 0 ? (
            <p className="empty-state">No tenés tareas {vista === 'hoy' ? 'para hoy' : 'próximas'}.</p>
          ) : (
            <ul className="mytasks-list">
              {visibles.map((task) => (
                <li key={task._id} className="mytasks-item">
                  <button
                    className={`mytasks-checkbox ${task.pendingReview ? 'is-checked' : ''}`}
                    title={task.pendingReview ? 'Deshacer' : 'Marcar como lista'}
                    onClick={() => handleToggle(task)}
                  >
                    {task.pendingReview && <Check size={13} />}
                  </button>
                  <div className="mytasks-item-body">
                    <p className="mytasks-item-title">{task.title}</p>
                    {task.description && <p className="mytasks-item-desc">{task.description}</p>}
                    <span className="mytasks-item-meta">
                      {task.project?.name && <>{task.project.name} · </>}
                      {formatFechaHora(task.dueDate)}
                    </span>
                  </div>
                  {task.pendingReview ? (
                    <span className="pill pill-amber">EN REVISIÓN</span>
                  ) : task.priority === 'high' ? (
                    <span className="pill pill-rose">ALTA</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {completadas.length > 0 && (
            <div className="mytasks-completed">
              <p className="mytasks-completed-title">Completadas ({completadas.length})</p>
              <ul className="mytasks-list">
                {completadas.slice(0, 5).map((task) => (
                  <li key={task._id} className="mytasks-item is-done">
                    <span className="mytasks-checkbox is-checked is-locked"><Check size={13} /></span>
                    <div className="mytasks-item-body">
                      <p className="mytasks-item-title is-done">{task.title}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mytasks-side card-panel">
          <h2>Proyectos activos</h2>
          {proyectosConProgreso.length === 0 ? (
            <p className="empty-state">Todavía no hay proyectos.</p>
          ) : (
            <ul className="mytasks-project-list">
              {proyectosConProgreso.map((project) => (
                <li key={project._id}>
                  <div className="mytasks-project-row">
                    <span>{project.name}</span>
                    <span>{project.progreso}%</span>
                  </div>
                  <div className="mytasks-project-track">
                    <div className="mytasks-project-fill" style={{ width: `${project.progreso}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTasks;
