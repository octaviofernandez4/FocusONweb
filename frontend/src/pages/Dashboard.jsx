import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, FileBarChart, ArrowRight, Check, X, Plus } from 'lucide-react';
import { getTasks, getTaskStats, updateTask, deleteTask } from '../services/taskService';
import { listMembers } from '../services/orgService';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { isTodayRelevant } from '../utils/dateHelpers';
import { getProjectColor } from '../utils/projectColors';
import StatCard from '../components/StatCard';
import TaskTable from '../components/TaskTable';
import NewTaskModal from '../components/NewTaskModal';
import './Dashboard.css';

const formatFechaHoy = () => {
  const texto = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

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
    : <EmployeeView user={user} tasks={tasks} stats={stats} projects={projects} members={members} navigate={navigate} />;
};

// --- Vista Empresa (admin) ---
const CompanyView = ({ stats, projects, members, tasks, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pendientesDeConfirmacion = tasks.filter((t) => t.pendingReview && !t.completed);
  const tareasActivas = tasks.filter((t) => !t.completed);

  const handleConfirmar = async (task) => {
    try {
      await updateTask(task._id, { ...task, completed: true });
      await onRefresh();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al confirmar la tarea');
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

  const handleToggle = async (task) => {
    try {
      await updateTask(task._id, { ...task, completed: !task.completed });
      await onRefresh();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al actualizar la tarea');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      await onRefresh();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al eliminar la tarea');
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
          <button className="btn-ghost" onClick={() => alert('Próximamente: filtro por período')}>
            <CalendarDays size={16} /> Este trimestre
          </button>
          <button className="btn-primary dashboard-report-btn" onClick={() => alert('Próximamente: generación de reportes')}>
            <FileBarChart size={16} /> Generar reporte
          </button>
        </div>
      </div>

      <div className="dashboard-stats">
        <StatCard label="PROYECTOS ACTIVOS" value={projects.length} hint="Proyectos en curso ahora mismo." tone="neutral" />
        <StatCard label="PRODUCTIVIDAD DEL EQUIPO" value={`${stats.completionRate}%`} hint="Tareas completadas vs. perdidas." tone="success" />
        <StatCard label="MIEMBROS DEL EQUIPO" value={members.length} hint="Personas en tu organización." tone="neutral" />
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
                  <button className="icon-btn icon-btn-success" title="Confirmar" onClick={() => handleConfirmar(task)}>
                    <Check size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="dashboard-tasks-section">
        <div className="dashboard-tasks-section-header">
          <h2>Tareas del equipo</h2>
          <button className="btn-primary dashboard-assign-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Asignar Nueva Tarea
          </button>
        </div>

        {tareasActivas.length === 0 ? (
          <p className="empty-state">No hay tareas activas. ¡Asigná la primera arriba!</p>
        ) : (
          <TaskTable tasks={tareasActivas} onToggle={handleToggle} onDelete={handleDelete} />
        )}
      </div>

      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={onRefresh} />
    </div>
  );
};

// --- Vista Empleado (member) ---
const EmployeeView = ({ user, tasks, stats, projects, members, navigate }) => {
  const misTareas = tasks
    .filter((t) => !t.completed && String(t.assignedTo?._id || t.assignedTo) === String(user?._id))
    .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
    .slice(0, 5);

  const tareasDeHoy = tasks.filter((t) => !t.completed && isTodayRelevant(t));
  const urgentes = tareasDeHoy.filter((t) => t.priority === 'high').length;

  const proyectosConProgreso = projects.map((project) => {
    const tareasDelProyecto = tasks.filter((t) => (t.project?._id || t.project) === project._id);
    const completadas = tareasDelProyecto.filter((t) => t.completed).length;
    const progreso = tareasDelProyecto.length === 0 ? 0 : Math.round((completadas / tareasDelProyecto.length) * 100);
    return { ...project, progreso };
  });

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
        <StatCard label="TAREAS PARA HOY" value={tareasDeHoy.length} hint={`Urgentes: ${urgentes}`} tone="neutral" />
        <StatCard label="COMPLETADAS ESTA SEMANA" value={stats.completedThisWeek} hint="Comparado con hoy." tone="success" />
        <StatCard label="PROGRESO PERSONAL" value="68%" hint="Meta trimestral — en camino." tone="neutral" />
      </div>

      <div className="dashboard-widgets">
        <div className="dashboard-widget card-panel">
          <div className="dashboard-widget-header">
            <h2>Mis tareas</h2>
          </div>
          {misTareas.length === 0 ? (
            <p className="empty-state">No tenés tareas pendientes asignadas. 🎉</p>
          ) : (
            <ul className="dashboard-task-list">
              {misTareas.map((task) => {
                const color = getProjectColor(task.project?.color);
                return (
                  <li key={task._id}>
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
          <button className="dashboard-widget-link" onClick={() => navigate('/app/inbox')}>
            Ver todas las tareas <ArrowRight size={14} />
          </button>
        </div>

        <div className="dashboard-widget card-panel">
          <div className="dashboard-widget-header">
            <h2>Proyectos activos</h2>
          </div>
          {proyectosConProgreso.length === 0 ? (
            <p className="empty-state">Todavía no hay proyectos.</p>
          ) : (
            <ul className="dashboard-project-list">
              {proyectosConProgreso.map((project) => (
                <li key={project._id}>
                  <div className="dashboard-project-row">
                    <span>{project.name}</span>
                    <span>{project.progreso}%</span>
                  </div>
                  <div className="dashboard-project-track">
                    <div className="dashboard-project-fill" style={{ width: `${project.progreso}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dashboard-widget card-panel">
          <div className="dashboard-widget-header">
            <h2>Equipo</h2>
          </div>
          {members.length === 0 ? (
            <p className="empty-state">No hay miembros para mostrar.</p>
          ) : (
            <ul className="dashboard-team-list">
              {members.map((m) => (
                <li key={m.id}>
                  <div className="dashboard-team-avatar">{`${m.name?.[0] || ''}${m.lastname?.[0] || ''}`.toUpperCase()}</div>
                  <div>
                    <p className="dashboard-task-title">{m.name} {m.lastname}</p>
                    <span className="dashboard-task-meta">{m.role === 'admin' ? 'Administrador' : 'Miembro'}</span>
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

export default Dashboard;
