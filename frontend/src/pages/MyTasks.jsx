import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCircle2 } from 'lucide-react';
import { getTasks, updateTask } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import Modal from '../components/Modal';
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
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [tareaAConfirmar, setTareaAConfirmar] = useState(null);

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

  // Departamentos (proyectos) donde tengo tareas asignadas, con mi propio progreso.
  const proyectosConProgreso = useMemo(() => {
    return projects
      .map((project) => {
        const tareasDelProyecto = misTareas.filter((t) => (t.project?._id || t.project) === project._id);
        const completadasProyecto = tareasDelProyecto.filter((t) => t.completed).length;
        const progreso = tareasDelProyecto.length === 0 ? 0 : Math.round((completadasProyecto / tareasDelProyecto.length) * 100);
        return { ...project, progreso, total: tareasDelProyecto.length };
      })
      .filter((project) => project.total > 0);
  }, [projects, misTareas]);

  const misTareasDelProyecto = proyectoSeleccionado
    ? misTareas.filter((t) => (t.project?._id || t.project) === proyectoSeleccionado._id)
    : misTareas;

  // Una vez vencida la fecha, la tarea pasa a "perdida" y se ve en Completadas,
  // no tiene sentido que siga colgada acá como si todavía se pudiera hacer a tiempo.
  const ahora = new Date();
  const activas = misTareasDelProyecto.filter(
    (t) => !t.completed && !(t.dueDate && new Date(t.dueDate) < ahora)
  );
  const tituloBox = proyectoSeleccionado ? proyectoSeleccionado.name : 'Mis tareas';

  const seleccionarProyecto = (project) => {
    setProyectoSeleccionado((actual) => (actual?._id === project._id ? null : project));
  };

  const handleToggle = async (task) => {
    try {
      await updateTask(task._id, { ...task, pendingReview: !task.pendingReview });
      await cargarTareas();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al actualizar la tarea');
    }
  };

  // Marcar como lista pide confirmación (es lo que dispara la revisión de la empresa);
  // deshacerla no, ya que no tiene consecuencias para nadie más.
  const handleCheckboxClick = (task) => {
    if (task.pendingReview) {
      handleToggle(task);
    } else {
      setTareaAConfirmar(task);
    }
  };

  const confirmarRealizacion = async () => {
    if (!tareaAConfirmar) return;
    await handleToggle(tareaAConfirmar);
    setTareaAConfirmar(null);
  };

  const abrirTarea = (task) => navigate(`/app/tasks/${task._id}`, { state: { task } });

  return (
    <div className="mytasks-page">
      <h1>Mis tareas</h1>
      <p className="page-subtitle">Todas las tareas que tenés asignadas.</p>

      <div className="mytasks-body">
        <div className="mytasks-main card-panel">
          <div className="mytasks-main-header">
            <h2>{tituloBox}</h2>
            {proyectoSeleccionado && (
              <button className="mytasks-clear-filter" onClick={() => setProyectoSeleccionado(null)}>
                Ver todas
              </button>
            )}
          </div>

          {isLoading ? (
            <p className="empty-state">Cargando tareas…</p>
          ) : activas.length === 0 ? (
            <p className="empty-state">
              {proyectoSeleccionado ? `No tenés tareas asignadas en ${proyectoSeleccionado.name}.` : 'No tenés tareas asignadas.'}
            </p>
          ) : (
            <ul className="mytasks-list">
              {activas.map((task) => (
                <li key={task._id} className="mytasks-item is-clickable" onClick={() => abrirTarea(task)}>
                  <button
                    className={`mytasks-checkbox ${task.pendingReview ? 'is-checked' : ''}`}
                    title={task.pendingReview ? 'Deshacer' : 'Marcar como lista'}
                    onClick={(e) => { e.stopPropagation(); handleCheckboxClick(task); }}
                  >
                    {task.pendingReview && <Check size={13} />}
                  </button>
                  <div className="mytasks-item-body">
                    <p className="mytasks-item-title">{task.title}</p>
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
        </div>

        <div className="mytasks-side card-panel">
          <h2>Proyectos activos</h2>
          {proyectosConProgreso.length === 0 ? (
            <p className="empty-state">Todavía no tenés tareas en ningún proyecto.</p>
          ) : (
            <ul className="mytasks-project-list">
              {proyectosConProgreso.map((project) => (
                <li
                  key={project._id}
                  className={`mytasks-project-item is-clickable ${proyectoSeleccionado?._id === project._id ? 'is-active' : ''}`}
                  onClick={() => seleccionarProyecto(project)}
                >
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

      <Modal isOpen={!!tareaAConfirmar} onClose={() => setTareaAConfirmar(null)} title="Confirmar tarea">
        <div className="confirm-task">
          <div className="confirm-task-icon"><CheckCircle2 size={26} /></div>
          <h3>¿Confirmar realización de la tarea?</h3>
          <p>
            {tareaAConfirmar && `"${tareaAConfirmar.title}"`} se va a marcar como lista para revisión y tu
            supervisor va a recibir la notificación.
          </p>
          <div className="confirm-task-actions">
            <button className="btn-ghost" onClick={() => setTareaAConfirmar(null)}>Cancelar</button>
            <button className="btn-primary" onClick={confirmarRealizacion}>Sí, confirmar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyTasks;
