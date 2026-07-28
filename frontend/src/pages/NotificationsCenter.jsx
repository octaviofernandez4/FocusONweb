import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRoundPlus, CheckCircle2, Trash2 } from 'lucide-react';
import { getTasks } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import { construirNotificaciones, formatRelativo } from '../utils/notifications';
import ReassignTaskModal from '../components/ReassignTaskModal';
import './NotificationsCenter.css';

const TABS = [
  { key: 'todas', label: 'Todas' },
  { key: 'nuevas', label: 'No leídas' },
  { key: 'anteriores', label: 'Anteriores' }
];

// Página completa detrás del "Ver todas las notificaciones" del dropdown de la campanita.
// Misma fuente de datos que NotificationsPanel (utils/notifications) para no duplicar lógica.
const NotificationsCenter = () => {
  const { user } = useAuth();
  const esEmpresa = user?.accountType === 'empresa';
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState('todas');
  const [ignoradas, setIgnoradas] = useState([]);
  const [leidas, setLeidas] = useState(false);
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const [reasignando, setReasignando] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const { nuevas: todasNuevas, anteriores } = construirNotificaciones(tasks, user, esEmpresa);
  const nuevas = todasNuevas.filter((n) => !ignoradas.includes(n.id));

  const items = useMemo(() => {
    const conTipo = [
      ...nuevas.map((n) => ({ ...n, esNueva: true })),
      ...anteriores.map((n) => ({ ...n, esNueva: false }))
    ];
    if (tab === 'nuevas') return conTipo.filter((n) => n.esNueva);
    if (tab === 'anteriores') return conTipo.filter((n) => !n.esNueva);
    return conTipo;
  }, [nuevas, anteriores, tab]);

  const seleccionada = items.find((n) => n.id === seleccionadaId) || items[0] || null;

  const irATarea = () => navigate('/app/inbox');
  const ignorar = (id) => setIgnoradas((prev) => [...prev, id]);
  const marcarTodasLeidas = () => setLeidas(true);

  return (
    <div className="notifcenter-page">
      <div className="notifcenter-header">
        <div>
          <h1>Centro de Notificaciones</h1>
          <p className="page-subtitle">Gestioná tus alertas y las novedades de tareas del equipo.</p>
        </div>
        <button className="btn-ghost" onClick={marcarTodasLeidas}>Marcar todas como leídas</button>
      </div>

      <div className="notifcenter-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`notifcenter-tab ${tab === t.key ? 'is-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}{t.key === 'nuevas' && !leidas && nuevas.length > 0 ? ` (${nuevas.length})` : ''}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="empty-state">Cargando notificaciones…</p>
      ) : items.length === 0 ? (
        <p className="empty-state">No hay notificaciones en esta pestaña.</p>
      ) : (
        <div className="notifcenter-body">
          <div className="notifcenter-list card-panel">
            {items.map((n) => (
              <button
                key={n.id}
                className={`notifcenter-item ${n.esNueva ? 'is-new' : ''} ${seleccionada?.id === n.id ? 'is-selected' : ''}`}
                onClick={() => setSeleccionadaId(n.id)}
              >
                <div className={`notifcenter-item-icon ${!n.esNueva ? 'is-muted' : ''}`}>
                  {n.esNueva ? <UserRoundPlus size={15} /> : <CheckCircle2 size={15} />}
                </div>
                <div className="notifcenter-item-body">
                  <p className="notifcenter-item-title">{n.title}</p>
                  <span className="notifcenter-item-time">{formatRelativo(n.time)}</span>
                </div>
              </button>
            ))}
          </div>

          {seleccionada && (
            <div className="notifcenter-detail card-panel">
              <div className={`notifcenter-detail-icon ${!seleccionada.esNueva ? 'is-muted' : ''}`}>
                {seleccionada.esNueva ? <UserRoundPlus size={20} /> : <CheckCircle2 size={20} />}
              </div>
              <h2>{seleccionada.title}</h2>
              <span className="notifcenter-detail-time">{formatRelativo(seleccionada.time)}</span>
              <p className="notifcenter-detail-text">{seleccionada.text}</p>

              {seleccionada.task?.project?.name && (
                <div className="notifcenter-detail-meta">
                  <span>PROYECTO</span>
                  <strong>{seleccionada.task.project.name}</strong>
                </div>
              )}

              <div className="notifcenter-detail-actions">
                <button className="btn-primary notifcenter-detail-btn" onClick={irATarea}>Abrir Tarea</button>
                {esEmpresa && seleccionada.task && (
                  <button className="btn-ghost notifcenter-detail-btn" onClick={() => setReasignando(seleccionada.task)}>
                    Reasignar
                  </button>
                )}
                {seleccionada.esNueva && (
                  <button className="icon-btn icon-btn-danger" title="Ignorar" onClick={() => ignorar(seleccionada.id)}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <ReassignTaskModal
        isOpen={!!reasignando}
        onClose={() => setReasignando(null)}
        task={reasignando}
        onReassigned={cargar}
      />
    </div>
  );
};

export default NotificationsCenter;
