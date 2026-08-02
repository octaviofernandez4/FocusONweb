import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, LayoutGrid, Clock, CheckCircle2, AlertTriangle, Circle, Ban } from 'lucide-react';
import { getTasks, updateTask } from '../services/taskService';
import { deleteProject } from '../services/projectService';
import { listMembers } from '../services/orgService';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { getProjectColor } from '../utils/projectColors';
import { getEstado } from '../utils/taskAccess';
import { isMissed } from '../utils/dateHelpers';
import TaskCard from '../components/TaskCard';
import NewTaskModal from '../components/NewTaskModal';
import NewProjectModal from '../components/NewProjectModal';
import ConfirmMarkReadyModal from '../components/ConfirmMarkReadyModal';
import Modal from '../components/Modal';
import AlertModal from '../components/AlertModal';
import './Projects.css';

const getInitials = (name, lastname) => `${name?.[0] || ''}${lastname?.[0] || ''}`.toUpperCase() || '?';

// Una columna del tablero — junta el header (punto de color + label + contador)
// con la lista de tarjetas. Si recibe `onDropTask`, además acepta que le
// suelten una tarjeta arrastrada ("En progreso" y "Para revisión"). Agregar
// tareas nuevas es solo desde el botón "Asignar nueva tarea" del encabezado.
const BoardColumn = ({ label, dotClass, count, tasks, onDropTask, emptyDropHint, onMoveToProgress, onMoveToPending }) => {
  const [arrastrandoEncima, setArrastrandoEncima] = useState(false);

  const handleDragOver = (e) => {
    if (!onDropTask) return;
    e.preventDefault();
    setArrastrandoEncima(true);
  };

  const handleDrop = (e) => {
    if (!onDropTask) return;
    e.preventDefault();
    setArrastrandoEncima(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) onDropTask(taskId);
  };

  return (
    <div
      className={`projects-column ${arrastrandoEncima ? 'is-drop-target' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setArrastrandoEncima(false)}
      onDrop={handleDrop}
    >
      <div className="projects-column-header">
        <span className={`projects-column-dot ${dotClass}`} />
        <h2>{label}</h2>
        <span className="projects-column-count">{count}</span>
      </div>
      <div className="projects-column-body">
        {tasks.length === 0 ? (
          <p className="empty-state projects-column-empty">
            {onDropTask ? `Sin tareas. ${emptyDropHint}` : 'Sin tareas.'}
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task._id} task={task} onMoveToProgress={onMoveToProgress} onMoveToPending={onMoveToPending} />
          ))
        )}
      </div>
    </div>
  );
};

// Tablero de proyectos tipo Kanban. La única acción de arrastrar-y-soltar que
// existe es la del empleado moviendo su propia tarea de "Por hacer" a "En
// progreso" (equivale a "marcar como lista", con la misma confirmación que en
// Mis tareas). El resto de las transiciones se hacen desde el detalle de tarea.
const Projects = () => {
  const { user } = useAuth();
  const { isAdmin, projects, refreshOrg } = useOrg();
  const esEmpresa = user?.accountType === 'empresa';
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');

  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [tareaAConfirmar, setTareaAConfirmar] = useState(null);
  const [proyectoAEliminar, setProyectoAEliminar] = useState(null);
  const [borradoNoPermitido, setBorradoNoPermitido] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const opciones = esEmpresa ? {} : { mine: true };
      const [tareas, equipo] = await Promise.all([
        getTasks(opciones),
        esEmpresa ? listMembers() : Promise.resolve([]),
      ]);
      setTasks(tareas);
      // El filtro de equipo es para elegir un compañero al que se le asignaron
      // tareas — el dueño/jefe de la cuenta empresa no tiene sentido que aparezca ahí.
      setMembers(equipo.filter((m) => String(m.id) !== String(user?._id)));
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [esEmpresa, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos();
  }, [cargarDatos]);

  const proyectoSeleccionado = projects.find((p) => p._id === selectedId) || null;

  // Empresa ve todos los proyectos de la org; empleado solo los que tienen
  // alguna tarea propia (mismo criterio que "Proyectos activos" en Mis tareas).
  const proyectosVisibles = useMemo(() => {
    if (esEmpresa) return projects;
    const idsConTareas = new Set(tasks.map((t) => t.project?._id || t.project).filter(Boolean));
    return projects.filter((p) => idsConTareas.has(p._id));
  }, [projects, tasks, esEmpresa]);

  const calcularStats = useCallback((lista) => {
    const total = lista.length;
    const completadas = lista.filter((t) => t.completed).length;
    const vencidas = lista.filter(isMissed).length;
    const listas = new Set(lista.map(getEstado)).size;
    const progreso = total === 0 ? 0 : Math.round((completadas / total) * 100);
    return { total, vencidas, listas, progreso };
  }, []);

  const statsTodos = useMemo(() => calcularStats(tasks), [tasks, calcularStats]);

  const statsPorProyecto = useMemo(() => {
    const mapa = new Map();
    proyectosVisibles.forEach((project) => {
      const tareasDelProyecto = tasks.filter((t) => (t.project?._id || t.project) === project._id);
      mapa.set(project._id, calcularStats(tareasDelProyecto));
    });
    return mapa;
  }, [proyectosVisibles, tasks, calcularStats]);

  const seleccionarProyecto = (projectId) => {
    setSearchParams(projectId ? { id: projectId } : {});
  };

  const alternarMiembro = (id) => setMiembroSeleccionado((actual) => (actual === id ? null : id));

  const tareasFiltradas = useMemo(() => {
    let base = proyectoSeleccionado
      ? tasks.filter((t) => (t.project?._id || t.project) === proyectoSeleccionado._id)
      : tasks;

    if (esEmpresa && miembroSeleccionado) {
      base = base.filter((t) => (t.assignedTo?._id || t.assignedTo) === miembroSeleccionado);
    }

    return base;
  }, [tasks, proyectoSeleccionado, miembroSeleccionado, esEmpresa]);

  const columnas = useMemo(() => {
    const porHacer = [];
    const enProgreso = [];
    const paraRevision = [];
    const completadas = [];
    tareasFiltradas.forEach((t) => {
      const estado = getEstado(t);
      if (estado === 'completed') completadas.push(t);
      else if (estado === 'review') paraRevision.push(t);
      else if (estado === 'progress') enProgreso.push(t);
      // Una "por hacer" vencida ya no es "por hacer" — se va a Incompletas
      // hasta que le pongan una fecha nueva, ahí sí vuelve a aparecer acá.
      else if (!isMissed(t)) porHacer.push(t);
    });
    return { porHacer, enProgreso, paraRevision, completadas };
  }, [tareasFiltradas]);

  const totalVencidas = useMemo(() => tareasFiltradas.filter(isMissed).length, [tareasFiltradas]);

  const totalVisibles = columnas.porHacer.length + columnas.enProgreso.length + columnas.paraRevision.length + columnas.completadas.length;

  const abrirEdicion = (project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const abrirCreacion = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const confirmarEliminarProyecto = async () => {
    if (!proyectoAEliminar) return;
    try {
      await deleteProject(proyectoAEliminar._id);
      if (selectedId === proyectoAEliminar._id) seleccionarProyecto(null);
      await refreshOrg();
      setProyectoAEliminar(null);
    } catch (error) {
      console.error(error);
      setProyectoAEliminar(null);
      setBorradoNoPermitido(true);
    }
  };

  const abrirNuevaTarea = () => setIsTaskModalOpen(true);

  // Sirve para las dos columnas soltables: valida que la tarjeta arrastrada
  // sea del empleado, suya, y que venga del estado que corresponde según a
  // dónde la soltó (si no, se ignora en silencio en vez de reventar).
  const tareaSoltableDesde = (taskId, estadoOrigenEsperado) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return null;
    const esAsignatario = String(task.assignedTo?._id || task.assignedTo) === String(user?._id);
    if (esEmpresa || !esAsignatario || getEstado(task) !== estadoOrigenEsperado || isMissed(task)) return null;
    return task;
  };

  // Soltar en "En progreso": solo un indicador personal de que ya arrancó,
  // no hace falta avisarle a la empresa — se guarda directo, sin modal.
  const handleDropEnProgreso = async (taskId) => {
    const task = tareaSoltableDesde(taskId, 'pending');
    if (!task) return;
    try {
      await updateTask(task._id, { ...task, inProgress: true });
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al actualizar la tarea');
    }
  };

  // Soltar en "Por hacer" desde "En progreso": deshace el indicador personal
  // de que ya había arrancado. Si ya está en "Para revisión" (o más allá) no
  // es soltable acá — tareaSoltableDesde exige que venga justo de 'progress'.
  const handleDropPorHacer = async (taskId) => {
    const task = tareaSoltableDesde(taskId, 'progress');
    if (!task) return;
    try {
      await updateTask(task._id, { ...task, inProgress: false });
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al actualizar la tarea');
    }
  };

  // Soltar en "Para revisión": esto sí avisa a la empresa, así que pide la
  // misma confirmación que el tilde de "Mis tareas".
  const handleDropParaRevision = (taskId) => {
    const task = tareaSoltableDesde(taskId, 'progress');
    if (!task) return;
    setTareaAConfirmar(task);
  };

  const confirmarMarcarLista = async () => {
    if (!tareaAConfirmar) return;
    try {
      await updateTask(tareaAConfirmar._id, { ...tareaAConfirmar, pendingReview: true });
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al actualizar la tarea');
    } finally {
      setTareaAConfirmar(null);
    }
  };

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1>Tablero de proyectos</h1>
          <p className="page-subtitle">Mirá en qué está trabajando cada persona y cómo avanzan las tareas.</p>
        </div>
        {esEmpresa && (
          <div className="projects-header-actions">
            <button className="btn-primary projects-new-btn" onClick={abrirNuevaTarea}>
              <Plus size={16} /> Asignar nueva tarea
            </button>
          </div>
        )}
      </div>

      <div className="projects-chips">
        <button
          className={`project-chip-card ${!proyectoSeleccionado ? 'is-active' : ''}`}
          onClick={() => seleccionarProyecto(null)}
        >
          <span className="project-chip-card-top">
            <LayoutGrid size={14} className="project-chip-card-icon" />
            <span className="project-chip-card-name">Todos</span>
          </span>
          <span className="project-chip-card-meta">
            {statsTodos.total} tareas · {statsTodos.listas} listas
            {statsTodos.vencidas > 0 && ` · ${statsTodos.vencidas} vencidas`}
          </span>
          <span className="project-chip-card-bar">
            <span className="project-chip-card-fill" style={{ width: `${statsTodos.progreso}%` }} />
          </span>
        </button>

        {proyectosVisibles.map((project) => {
          const color = getProjectColor(project.color);
          const stats = statsPorProyecto.get(project._id) || { total: 0, vencidas: 0, listas: 0, progreso: 0 };
          return (
            <div
              key={project._id}
              className={`project-chip-card-wrap ${proyectoSeleccionado?._id === project._id ? 'is-active' : ''}`}
            >
              <button className="project-chip-card" onClick={() => seleccionarProyecto(project._id)}>
                <span className="project-chip-card-top">
                  <span className="project-chip-card-dot" style={{ background: color.dot }} />
                  <span className="project-chip-card-name">{project.name}</span>
                </span>
                <span className="project-chip-card-meta">
                  {stats.total} tareas · {stats.listas} listas
                  {stats.vencidas > 0 && ` · ${stats.vencidas} vencidas`}
                </span>
                <span className="project-chip-card-bar">
                  <span className="project-chip-card-fill" style={{ width: `${stats.progreso}%`, background: color.dot }} />
                </span>
              </button>
              {isAdmin && (
                <div className="project-chip-card-actions">
                  <button className="icon-btn" title="Editar proyecto" onClick={() => abrirEdicion(project)}>
                    <Pencil size={12} />
                  </button>
                  <button className="icon-btn icon-btn-danger" title="Borrar proyecto" onClick={() => setProyectoAEliminar(project)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {esEmpresa && (
          <button className="project-chip-card project-chip-card-new" onClick={abrirCreacion}>
            <Plus size={18} />
            <span>Nuevo proyecto</span>
          </button>
        )}
      </div>

      <div className="projects-stats">
        <div className="projects-stat-pill">
          <span className="projects-stat-icon"><Circle size={16} /></span>
          <span className="projects-stat-text">
            <strong>{totalVisibles}</strong>
            <small>Tareas visibles</small>
          </span>
        </div>
        <div className="projects-stat-pill">
          <span className="projects-stat-icon is-progress"><Clock size={16} /></span>
          <span className="projects-stat-text">
            <strong>{columnas.enProgreso.length}</strong>
            <small>En progreso</small>
          </span>
        </div>
        <div className="projects-stat-pill">
          <span className="projects-stat-icon is-success"><CheckCircle2 size={16} /></span>
          <span className="projects-stat-text">
            <strong>{columnas.completadas.length}</strong>
            <small>Completadas</small>
          </span>
        </div>
        <div className="projects-stat-pill">
          <span className="projects-stat-icon is-danger"><AlertTriangle size={16} /></span>
          <span className="projects-stat-text">
            <strong>{totalVencidas}</strong>
            <small>Vencidas</small>
          </span>
        </div>
      </div>

      {esEmpresa && members.length > 0 && (
        <div className="projects-toolbar">
          <div className="projects-team-filter">
            <span className="projects-team-label">Equipo:</span>
            <button
              className={`projects-team-chip ${!miembroSeleccionado ? 'is-active' : ''}`}
              onClick={() => setMiembroSeleccionado(null)}
            >
              Todos
            </button>
            {members.map((m) => (
              <button
                key={m.id}
                className={`projects-team-avatar ${miembroSeleccionado === m.id ? 'is-active' : ''}`}
                title={`${m.name} ${m.lastname || ''}`}
                onClick={() => alternarMiembro(m.id)}
              >
                {m.avatarUrl ? <img src={m.avatarUrl} alt={m.name} /> : getInitials(m.name, m.lastname)}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="empty-state">Cargando tareas…</p>
      ) : (
        <div className="projects-board">
          <BoardColumn
            label="Por hacer"
            dotClass="is-neutral"
            count={columnas.porHacer.length}
            tasks={columnas.porHacer}
            onDropTask={!esEmpresa ? handleDropPorHacer : null}
            emptyDropHint='Arrastrá una de "En progreso" para volverla a la lista.'
            onMoveToProgress={!esEmpresa ? handleDropEnProgreso : undefined}
          />
          <BoardColumn
            label="En progreso"
            dotClass="is-progress"
            count={columnas.enProgreso.length}
            tasks={columnas.enProgreso}
            onDropTask={!esEmpresa ? handleDropEnProgreso : null}
            emptyDropHint='Arrastrá una de "Por hacer" para empezarla.'
            onMoveToPending={!esEmpresa ? handleDropPorHacer : undefined}
          />
          <BoardColumn
            label="Para revisión"
            dotClass="is-review"
            count={columnas.paraRevision.length}
            tasks={columnas.paraRevision}
            onDropTask={!esEmpresa ? handleDropParaRevision : null}
            emptyDropHint='Arrastrá una de "En progreso" cuando esté lista.'
          />
          <BoardColumn
            label="Completadas"
            dotClass="is-success"
            count={columnas.completadas.length}
            tasks={columnas.completadas}
          />
        </div>
      )}

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={refreshOrg}
        project={editingProject}
        existingCount={projects.length}
      />

      {esEmpresa && (
        <NewTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onCreated={cargarDatos}
          defaultProjectId={proyectoSeleccionado?._id}
        />
      )}

      <ConfirmMarkReadyModal
        isOpen={!!tareaAConfirmar}
        onClose={() => setTareaAConfirmar(null)}
        task={tareaAConfirmar}
        onConfirm={confirmarMarcarLista}
      />

      <Modal isOpen={!!proyectoAEliminar} onClose={() => setProyectoAEliminar(null)} title="Eliminar proyecto">
        <div className="confirm-danger">
          <div className="confirm-danger-icon"><AlertTriangle size={24} /></div>
          <h3>¿Eliminar Proyecto?</h3>
          <p>
            ¿Estás seguro de que deseas eliminar el proyecto &quot;<strong>{proyectoAEliminar?.name}</strong>&quot;? Esta
            acción solo se puede realizar si el proyecto no tiene tareas asociadas.
          </p>
          <div className="confirm-danger-actions">
            <button className="btn-ghost" onClick={() => setProyectoAEliminar(null)}>Cancelar</button>
            <button className="btn-danger" onClick={confirmarEliminarProyecto}>Confirmar Eliminación</button>
          </div>
        </div>
      </Modal>

      <AlertModal
        isOpen={borradoNoPermitido}
        onClose={() => setBorradoNoPermitido(false)}
        icon={Ban}
        title="Acción No Permitida"
        buttonLabel="Entendido"
      >
        <p>No se puede eliminar un proyecto que todavía tiene tareas activas. Borrá o reasigná esas tareas a otro proyecto antes de intentarlo de nuevo.</p>
      </AlertModal>
    </div>
  );
};

export default Projects;
