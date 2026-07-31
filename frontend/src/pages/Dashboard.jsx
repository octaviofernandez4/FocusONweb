import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ArrowRight, Check, X, Plus } from 'lucide-react';
import { getTasks, getTaskStats, updateTask } from '../services/taskService';
import { listMembers } from '../services/orgService';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { isSameLocalDay } from '../utils/dateHelpers';
import { getProjectColor } from '../utils/projectColors';
import StatCard from '../components/StatCard';
import NewTaskModal from '../components/NewTaskModal';
import ApproveTaskModal from '../components/ApproveTaskModal';
import './Dashboard.css';

const formatFechaHoy = () => {
  const texto = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const NOMBRES_DIA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const Dashboard = () => {
  const { user } = useAuth();
  const { projects } = useOrg();
  const navigate = useNavigate();
  const esEmpresa = user?.accountType === 'empresa';

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const cargarDatos = useCallback(async () => {
    try {
      const [tareas, estadisticas, equipo] = await Promise.all([getTasks(), getTaskStats(), listMembers()]);
      setTasks(tareas);
      setStats(estadisticas);
      setMembers(equipo);
    } catch (error) {
      console.error('Error al cargar el dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos();
  }, [cargarDatos]);

  if (isLoading) {
    return <p className="empty-state">Cargando dashboard…</p>;
  }

  return esEmpresa
    ? <CompanyView stats={stats} projects={projects} members={members} tasks={tasks} onRefresh={cargarDatos} />
    : <EmployeeView user={user} tasks={tasks} stats={stats} navigate={navigate} />;
};

// --- Vista Empresa (admin) ---
const CompanyView = ({ stats, projects, members, tasks, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tareaAAprobar, setTareaAAprobar] = useState(null);
  const pendientesDeConfirmacion = tasks.filter((t) => t.pendingReview && !t.completed);

  // Actividad real de la semana en curso (lunes a sábado, sin domingo): cuántas
  // tareas se crearon vs. se completaron cada día (sale de createdAt/completedAt).
  const actividadSemanal = useMemo(() => {
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0=Dom, 1=Lun, ... 6=Sáb
    const diasDesdeElLunes = diaSemana === 0 ? 6 : diaSemana - 1;
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diasDesdeElLunes);

    const dias = [];
    for (let i = 0; i < 6; i++) {
      const fecha = new Date(lunes);
      fecha.setDate(lunes.getDate() + i);
      const completadas = tasks.filter((t) => t.completedAt && isSameLocalDay(t.completedAt, fecha)).length;
      const asignadas = tasks.filter((t) => t.createdAt && isSameLocalDay(t.createdAt, fecha)).length;
      dias.push({ label: NOMBRES_DIA[fecha.getDay()], completadas, asignadas });
    }
    return dias;
  }, [tasks]);
  const maxActividad = Math.max(1, ...actividadSemanal.flatMap((d) => [d.completadas, d.asignadas]));
  const totalCompletadasSemana = actividadSemanal.reduce((sum, d) => sum + d.completadas, 0);
  const totalAsignadasSemana = actividadSemanal.reduce((sum, d) => sum + d.asignadas, 0);
  const porcentajeCompletadasSemana = totalAsignadasSemana === 0 ? 0 : Math.round((totalCompletadasSemana / totalAsignadasSemana) * 100);

  // Carga de trabajo real por proyecto: tareas activas ahora mismo, normalizadas
  // contra el proyecto más cargado. "Sobrecarga" = tiene más tareas activas que completadas.
  const cargaPorProyecto = useMemo(() => {
    const datos = projects.map((project) => {
      const tareasDelProyecto = tasks.filter((t) => (t.project?._id || t.project) === project._id);
      const activas = tareasDelProyecto.filter((t) => !t.completed).length;
      const completadas = tareasDelProyecto.filter((t) => t.completed).length;
      return { ...project, activas, sobrecarga: activas > 0 && activas > completadas };
    });
    const max = Math.max(1, ...datos.map((d) => d.activas));
    return datos.map((d) => ({ ...d, porcentaje: Math.round((d.activas / max) * 100) }));
  }, [projects, tasks]);

  const handleApproveSubmit = async ({ qualityLevel, comentario }) => {
    if (!tareaAAprobar) return;
    try {
      await updateTask(tareaAAprobar._id, { ...tareaAAprobar, completed: true, qualityLevel, completionComment: comentario });
      await onRefresh();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al confirmar la tarea');
    } finally {
      setTareaAAprobar(null);
    }
  };

  const handleRechazar = async (task) => {
    try {
      await updateTask(task._id, { ...task, pendingReview: false });
      await onRefresh();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al rechazar la tarea');
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Resumen de la empresa</h1>
          <p className="page-subtitle">Estado en tiempo real del desempeño y la actividad de tu equipo.</p>
        </div>
        <div className="dashboard-header-actions">
          <button className="btn-primary dashboard-assign-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Asignar Nueva Tarea
          </button>
        </div>
      </div>

      <div className="dashboard-stats">
        <StatCard label="PROYECTOS ACTIVOS" value={projects.length} hint="Proyectos en curso ahora mismo." tone="neutral" />
        <StatCard label="PRODUCTIVIDAD DEL EQUIPO" value={`${stats.completionRate}%`} hint="Tareas completadas vs. perdidas." tone="success" />
        <StatCard label="MIEMBROS DEL EQUIPO" value={members.length} hint="Personas en tu organización." tone="neutral" />
        <StatCard
          label="PENDIENTES DE CONFIRMACIÓN"
          value={pendientesDeConfirmacion.length}
          hint={pendientesDeConfirmacion.length > 0 ? 'Esperando tu revisión.' : 'Todo al día.'}
          tone={pendientesDeConfirmacion.length > 0 ? 'danger' : 'success'}
        />
      </div>

      {pendientesDeConfirmacion.length > 0 && (
        <div className="dashboard-widget card-panel dashboard-review-widget">
          <div className="dashboard-widget-header">
            <h2>Tareas pendientes de confirmación ({pendientesDeConfirmacion.length})</h2>
          </div>
          <ul className="dashboard-review-list">
            {pendientesDeConfirmacion.map((task) => (
              <li key={task._id}>
                <div>
                  <p className="dashboard-task-title">{task.title}</p>
                  <span className="dashboard-task-meta">
                    {task.user?.name ? `${task.user.name} ${task.user.lastname || ''}` : 'Alguien del equipo'}
                    {task.project?.name && <> · {task.project.name}</>}
                  </span>
                </div>
                <div className="dashboard-review-actions">
                  <button className="icon-btn icon-btn-danger" title="Rechazar" onClick={() => handleRechazar(task)}>
                    <X size={16} />
                  </button>
                  <button className="icon-btn icon-btn-success" title="Confirmar" onClick={() => setTareaAAprobar(task)}>
                    <Check size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="dashboard-company-widgets">
        <div className="dashboard-widget card-panel">
          <div className="dashboard-widget-header">
            <h2>Actividad semanal de tareas</h2>
          </div>
          {tasks.length === 0 ? (
            <p className="empty-state">Todavía no hay actividad para mostrar.</p>
          ) : (
            <>
              <div className="dashboard-activity-chart">
                {actividadSemanal.map((dia) => (
                  <div key={dia.label} className="dashboard-activity-bar-col">
                    <div className="dashboard-activity-bar-track">
                      <div
                        className="dashboard-activity-bar is-completadas"
                        title={`${dia.completadas} completadas`}
                        style={{ height: `${(dia.completadas / maxActividad) * 100}%` }}
                      />
                      <div
                        className="dashboard-activity-bar is-asignadas"
                        title={`${dia.asignadas} asignadas`}
                        style={{ height: `${(dia.asignadas / maxActividad) * 100}%` }}
                      />
                    </div>
                    <span className="dashboard-activity-day">{dia.label}</span>
                  </div>
                ))}
              </div>
              <div className="dashboard-activity-legend">
                <span><i className="dashboard-legend-dot is-completadas" />Completadas ({porcentajeCompletadasSemana}%)</span>
                <span><i className="dashboard-legend-dot is-asignadas" />Asignadas</span>
              </div>
            </>
          )}
        </div>

        <div className="dashboard-widget card-panel">
          <div className="dashboard-widget-header">
            <h2>Carga de trabajo por proyecto</h2>
          </div>
          {cargaPorProyecto.length === 0 ? (
            <p className="empty-state">Todavía no hay proyectos.</p>
          ) : (
            <div className="dashboard-workload-list">
              {cargaPorProyecto.map((project) => (
                <div key={project._id} className="dashboard-workload-item">
                  <div className="dashboard-project-row">
                    <span>{project.name}</span>
                    <span>{project.activas} activa{project.activas === 1 ? '' : 's'}</span>
                  </div>
                  <div className="dashboard-project-track">
                    <div className={`dashboard-project-fill ${project.sobrecarga ? 'is-overload' : ''}`} style={{ width: `${project.porcentaje}%` }} />
                  </div>
                  {project.sobrecarga && <span className="dashboard-workload-flag">Más tareas activas que completadas</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={onRefresh} />

      <ApproveTaskModal
        isOpen={!!tareaAAprobar}
        onClose={() => setTareaAAprobar(null)}
        task={tareaAAprobar}
        onSubmit={handleApproveSubmit}
      />
    </div>
  );
};

// --- Vista Empleado (member) ---
const EmployeeView = ({ user, tasks, stats, navigate }) => {
  const misTareas = tasks.filter((t) => String(t.assignedTo?._id || t.assignedTo) === String(user?._id));
  const hoy = new Date();

  // Estrictamente las de hoy (o sin fecha) — las vencidas de días anteriores
  // ya no se cuelan acá, se reflejan en el contador de "incompletas de la semana".
  const misTareasHoy = misTareas
    .filter((t) => !t.completed && (!t.dueDate || isSameLocalDay(t.dueDate, hoy)))
    .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
  const urgentes = misTareasHoy.filter((t) => t.priority === 'high').length;

  // Tareas de la semana en curso (lunes a domingo) que siguen sin completarse,
  // sin importar si ya vencieron o vencen más adelante en la semana.
  const diaSemana = hoy.getDay();
  const diasDesdeElLunes = diaSemana === 0 ? 6 : diaSemana - 1;
  const lunes = new Date(hoy);
  lunes.setHours(0, 0, 0, 0);
  lunes.setDate(hoy.getDate() - diasDesdeElLunes);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);

  const incompletasSemana = misTareas.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate) >= lunes && new Date(t.dueDate) <= domingo
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Bienvenido/a de nuevo, {user?.name}</h1>
          <p className="page-subtitle">Esto es lo que necesita tu atención hoy, {formatFechaHoy()}.</p>
        </div>
        <div className="dashboard-header-actions">
          <button className="btn-ghost" onClick={() => navigate('/app/projects')}>
            <CalendarDays size={16} /> Ver proyectos
          </button>
        </div>
      </div>

      <div className="dashboard-stats">
        <StatCard label="TAREAS PARA HOY" value={misTareasHoy.length} hint={`Urgentes: ${urgentes}`} tone="neutral" />
        <StatCard label="COMPLETADAS ESTA SEMANA" value={stats.completedThisWeek} hint="Comparado con hoy." tone="success" />
        <StatCard
          label="INCOMPLETAS DE LA SEMANA"
          value={incompletasSemana.length}
          hint="Vencidas o pendientes de esta semana."
          tone="danger"
        />
        <StatCard label="PROGRESO PERSONAL" value="68%" hint="Meta trimestral — en camino." tone="neutral" />
      </div>

      <div className="dashboard-widgets">
        <div className="dashboard-widget card-panel">
          <div className="dashboard-widget-header">
            <h2>Mis tareas de hoy</h2>
          </div>
          {misTareasHoy.length === 0 ? (
            <p className="empty-state">No tenés tareas asignadas para hoy. 🎉</p>
          ) : (
            <ul className="dashboard-task-list">
              {misTareasHoy.map((task) => {
                const color = getProjectColor(task.project?.color);
                return (
                  <li
                    key={task._id}
                    className="is-clickable"
                    onClick={() => navigate(`/app/tasks/${task._id}`, { state: { task } })}
                  >
                    <div>
                      <p className="dashboard-task-title">{task.title}</p>
                      <span className="dashboard-task-meta">
                        {task.dueDate ? new Date(task.dueDate).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'}
                        {task.project?.name && <> · {task.project.name}</>}
                      </span>
                    </div>
                    {task.pendingReview ? (
                      <span className="pill pill-amber">EN REVISIÓN</span>
                    ) : task.priority === 'high' ? (
                      <span className="pill" style={{ background: color.bg, color: color.text }}>ALTA</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          <button className="dashboard-widget-link" onClick={() => navigate('/app/mytasks')}>
            Ver todas las tareas <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
