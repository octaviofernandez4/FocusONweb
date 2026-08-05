import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { getTasks, updateTask } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { usePageTitle } from '../hooks/usePageTitle';
import { isMissed, isSameLocalDay } from '../utils/dateHelpers';
import ConfirmMarkReadyModal from '../components/ConfirmMarkReadyModal';
import AlertModal from '../components/AlertModal';
import TaskListItem from '../components/TaskListItem';
import './MyTasks.css';

// "Mis tareas" — solo la cuenta empleado la ve en el sidebar. Muestra únicamente
// las tareas asignadas a mí; el tilde marca "lista para revisión" (nunca confirma).
const MyTasks = () => {
  usePageTitle('Mis Tareas');
  const { user } = useAuth();
  const { projects } = useOrg();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [tareaAConfirmar, setTareaAConfirmar] = useState(null);
  const [accionRestringida, setAccionRestringida] = useState(false);

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

  // Una vez vencida la fecha, la tarea pasa a "perdida" y se ve en Incompletas,
  // no tiene sentido que siga colgada acá como si todavía se pudiera hacer a tiempo.
  const activas = misTareasDelProyecto.filter((t) => !t.completed && !isMissed(t));

  // Separadas para que se note cuáles hay que terminar hoy mismo, sin mezclarlas
  // con lo que todavía tiene margen de días.
  const paraHoy = activas.filter((t) => t.dueDate && isSameLocalDay(t.dueDate, new Date()));
  const masAdelante = activas.filter((t) => !(t.dueDate && isSameLocalDay(t.dueDate, new Date())));

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

  // Marcar como lista pide confirmación (dispara la revisión de la empresa). Una vez
  // enviada, ya no se puede destildar desde acá — eso ahora depende solo de la empresa
  // (confirmándola o reabriéndola), así nadie retira un envío a mitad de revisión.
  const handleCheckboxClick = (task) => {
    if (task.pendingReview) {
      setAccionRestringida(true);
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
            <>
              {paraHoy.length > 0 && (
                <div className="mytasks-group">
                  <h3 className="mytasks-group-title is-today">Para hoy</h3>
                  <ul className="mytasks-list">
                    {paraHoy.map((task) => (
                      <TaskListItem key={task._id} task={task} onOpen={abrirTarea} onCheckboxClick={handleCheckboxClick} />
                    ))}
                  </ul>
                </div>
              )}

              {masAdelante.length > 0 && (
                <div className="mytasks-group">
                  {paraHoy.length > 0 && <h3 className="mytasks-group-title">Más adelante</h3>}
                  <ul className="mytasks-list">
                    {masAdelante.map((task) => (
                      <TaskListItem key={task._id} task={task} onOpen={abrirTarea} onCheckboxClick={handleCheckboxClick} />
                    ))}
                  </ul>
                </div>
              )}
            </>
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

      <ConfirmMarkReadyModal
        isOpen={!!tareaAConfirmar}
        onClose={() => setTareaAConfirmar(null)}
        task={tareaAConfirmar}
        onConfirm={confirmarRealizacion}
      />

      <AlertModal
        isOpen={accionRestringida}
        onClose={() => setAccionRestringida(false)}
        icon={Lock}
        title="Acción restringida"
      >
        <p>Solo una cuenta de empresa puede confirmar o reabrir una tarea.</p>
      </AlertModal>
    </div>
  );
};

export default MyTasks;
