import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
// El buscador filtra por título de tarea o por nombre de proyecto, y al hacer clic
// despliega accesos rápidos: "Mis tareas" y los departamentos que tienen tareas.
const Inbox = () => {
  const { user } = useAuth();
  const esEmpresa = user?.accountType === 'empresa';
  const searchWrapRef = useRef(null);

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtro, setFiltro] = useState('todas'); // 'todas' | 'mias' | id de proyecto
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

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

  // Departamentos que tienen al menos una tarea pendiente, para los accesos rápidos del buscador.
  const departamentosConTareas = useMemo(() => {
    const vistos = new Map();
    pendientes.forEach((t) => {
      if (t.project?._id && !vistos.has(t.project._id)) vistos.set(t.project._id, t.project.name);
    });
    return Array.from(vistos, ([id, name]) => ({ id, name }));
  }, [pendientes]);

  const filtradas = useMemo(() => {
    let base = pendientes;
    if (filtro === 'mias') {
      base = base.filter((t) => String(t.assignedTo?._id || t.assignedTo) === String(user?._id));
    } else if (filtro !== 'todas') {
      base = base.filter((t) => (t.project?._id || t.project) === filtro);
    }

    const texto = busqueda.trim().toLowerCase();
    if (!texto) return base;
    return base.filter((t) =>
      t.title.toLowerCase().includes(texto) || (t.project?.name || '').toLowerCase().includes(texto)
    );
  }, [pendientes, busqueda, filtro, user]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);

  const cambiarBusqueda = (valor) => { setBusqueda(valor); setPagina(1); };

  const elegirFiltro = (valor) => {
    setFiltro(valor);
    setPagina(1);
    setDropdownAbierto(false);
  };

  useEffect(() => {
    const cerrarSiEsAfuera = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) setDropdownAbierto(false);
    };
    document.addEventListener('mousedown', cerrarSiEsAfuera);
    return () => document.removeEventListener('mousedown', cerrarSiEsAfuera);
  }, []);

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
        <div className="inbox-search-wrap" ref={searchWrapRef}>
          <div className="inbox-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Filtrar tareas… (por título o proyecto)"
              value={busqueda}
              onFocus={() => setDropdownAbierto(true)}
              onChange={(e) => cambiarBusqueda(e.target.value)}
            />
          </div>

          {dropdownAbierto && (
            <div className="inbox-search-dropdown card-panel">
              <button
                className={`inbox-filter-chip ${filtro === 'todas' ? 'is-active' : ''}`}
                onClick={() => elegirFiltro('todas')}
              >
                Todas
              </button>
              <button
                className={`inbox-filter-chip ${filtro === 'mias' ? 'is-active' : ''}`}
                onClick={() => elegirFiltro('mias')}
              >
                Mis tareas
              </button>
              {departamentosConTareas.map((dep) => (
                <button
                  key={dep.id}
                  className={`inbox-filter-chip ${filtro === dep.id ? 'is-active' : ''}`}
                  onClick={() => elegirFiltro(dep.id)}
                >
                  {dep.name}
                </button>
              ))}
            </div>
          )}
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
