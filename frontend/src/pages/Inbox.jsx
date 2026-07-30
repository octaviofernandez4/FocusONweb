import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, FileDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTasks, getTaskStats, updateTask, deleteTask } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import { getTaskAccess } from '../utils/taskAccess';
import StatCard from '../components/StatCard';
import NewTaskModal from '../components/NewTaskModal';
import TaskTable from '../components/TaskTable';
import './Inbox.css';

const PAGE_SIZE = 8;

// "Tareas del equipo" — vista de tabla compartida por ambas cuentas. Las acciones
// de cada fila (check/borrar) respetan las mismas reglas que TaskCard (ver utils/taskAccess).
const Inbox = () => {
  const { user } = useAuth();
  const esEmpresa = user?.accountType === 'empresa';

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [pagina, setPagina] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const [tareas, estadisticas] = await Promise.all([getTasks(), getTaskStats()]);
      setTasks(tareas);
      setStats(estadisticas);
    } catch (error) {
      console.error('Error al cargar la bandeja:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos();
  }, [cargarDatos]);

  const pendientes = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return pendientes
      .filter((t) => !texto || t.title.toLowerCase().includes(texto))
      .filter((t) => {
        if (filtro === 'mias') return String(t.assignedTo?._id || t.assignedTo) === String(user?._id);
        if (filtro === 'alta') return t.priority === 'high';
        return true;
      });
  }, [pendientes, busqueda, filtro, user]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);

  const cambiarBusqueda = (valor) => { setBusqueda(valor); setPagina(1); };
  const cambiarFiltro = (valor) => { setFiltro(valor); setPagina(1); };

  const handleToggle = async (task) => {
    const { esEmpresa: puedeConfirmar } = getTaskAccess(task, user);
    try {
      const payload = puedeConfirmar
        ? { ...task, completed: !task.completed }
        : { ...task, pendingReview: !task.pendingReview };
      await updateTask(task._id, payload);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al actualizar la tarea');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al eliminar la tarea');
    }
  };

  return (
    <div className="inbox-page">
      <div className="inbox-header">
        <div>
          <h1>Tareas del equipo</h1>
          <p className="page-subtitle">Todas las tareas pendientes del equipo, sin importar la fecha.</p>
        </div>
        <div className="inbox-header-actions">
          <button className="btn-ghost" onClick={() => alert('Próximamente: exportar reporte')}>
            <FileDown size={16} /> Exportar reporte
          </button>
          {esEmpresa && (
            <button className="btn-primary inbox-assign-btn" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Asignar Nueva Tarea
            </button>
          )}
        </div>
      </div>

      {stats && (
        <div className="inbox-stats">
          <StatCard label="TASA DE FINALIZACIÓN" value={`${stats.completionRate}%`} hint="Tareas completadas vs. perdidas." tone="success" />
          <StatCard label="TAREAS VENCIDAS" value={stats.missedCount} hint="Sin completar y fuera de fecha." tone="danger" />
          <StatCard label="TAREAS ACTIVAS" value={pendientes.length} hint="Pendientes o en revisión ahora mismo." tone="neutral" />
        </div>
      )}

      <div className="inbox-toolbar">
        <div className="inbox-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Filtrar tareas…"
            value={busqueda}
            onChange={(e) => cambiarBusqueda(e.target.value)}
          />
        </div>
        <div className="inbox-filter-chips">
          <button className={`inbox-filter-chip ${filtro === 'todas' ? 'is-active' : ''}`} onClick={() => cambiarFiltro('todas')}>Todas</button>
          <button className={`inbox-filter-chip ${filtro === 'mias' ? 'is-active' : ''}`} onClick={() => cambiarFiltro('mias')}>Mis tareas</button>
          <button className={`inbox-filter-chip ${filtro === 'alta' ? 'is-active' : ''}`} onClick={() => cambiarFiltro('alta')}>Alta prioridad</button>
        </div>
      </div>

      {isLoading ? (
        <p className="empty-state">Cargando tareas…</p>
      ) : filtradas.length === 0 ? (
        <p className="empty-state">No hay tareas que coincidan con el filtro.</p>
      ) : (
        <>
          <TaskTable tasks={visibles} onToggle={handleToggle} onDelete={handleDelete} />

          <div className="inbox-pagination">
            <span>Mostrando {(paginaActual - 1) * PAGE_SIZE + 1}–{Math.min(paginaActual * PAGE_SIZE, filtradas.length)} de {filtradas.length}</span>
            <div className="inbox-pagination-actions">
              <button className="icon-btn" disabled={paginaActual === 1} onClick={() => setPagina((p) => p - 1)}>
                <ChevronLeft size={15} />
              </button>
              <button className="icon-btn" disabled={paginaActual === totalPaginas} onClick={() => setPagina((p) => p + 1)}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </>
      )}

      {esEmpresa && (
        <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={cargarDatos} />
      )}
    </div>
  );
};

export default Inbox;
