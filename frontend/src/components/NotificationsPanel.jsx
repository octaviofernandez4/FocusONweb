import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, UserRoundPlus, CheckCircle2, ArrowRight } from 'lucide-react';
import { getTasks } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { construirNotificaciones, formatRelativo } from '../utils/notifications';
import './NotificationsPanel.css';

// El dropdown solo muestra un adelanto (sin scroll interno); el resto se ve
// en /app/notifications vía "Ver todas las notificaciones".
const NUEVAS_LIMITE = 3;
const ANTERIORES_LIMITE = 2;

// Bandeja de notificaciones, compartida por ambos paneles (empresa/empleado).
// No hay backend de notificaciones — se derivan en el momento a partir de las
// tareas reales (asignaciones, listas para revisión, confirmadas).
const NotificationsPanel = () => {
  const { user } = useAuth();
  const esEmpresa = user?.accountType === 'empresa';
  const navigate = useNavigate();
  const wrapRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [ignoradas, setIgnoradas] = useState([]);
  const [leidas, setLeidas] = useState(false);
  useBodyScrollLock(isOpen);

  const cargar = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      cargar();
    }
  }, [isOpen, cargar]);

  useEffect(() => {
    const cerrarSiEsAfuera = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', cerrarSiEsAfuera);
    return () => document.removeEventListener('mousedown', cerrarSiEsAfuera);
  }, []);

  const { nuevas: todasNuevas, anteriores: todasAnteriores } = construirNotificaciones(tasks, user, esEmpresa);
  const nuevas = todasNuevas.filter((n) => !ignoradas.includes(n.id));
  const badgeCount = leidas ? 0 : nuevas.length;

  const nuevasVisibles = nuevas.slice(0, NUEVAS_LIMITE);
  const anterioresVisibles = todasAnteriores.slice(0, ANTERIORES_LIMITE);

  const irATarea = (task) => {
    if (task) {
      navigate(`/app/tasks/${task._id}`, { state: { task } });
    } else {
      navigate('/app/inbox');
    }
    setIsOpen(false);
  };

  const ignorar = (id) => setIgnoradas((prev) => [...prev, id]);

  const marcarTodasLeidas = () => setLeidas(true);

  const abrir = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) setLeidas(false);
  };

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button className="icon-btn notif-trigger" title="Notificaciones" onClick={abrir}>
        <Bell size={20} />
        {badgeCount > 0 && <span className="notif-badge">{badgeCount}</span>}
      </button>

      {isOpen && (
        <div className="notif-panel card-panel">
          <div className="notif-panel-header">
            <h3>Notificaciones {nuevas.length > 0 && <span className="notif-badge-inline">{nuevas.length}</span>}</h3>
            <button className="notif-mark-read" onClick={marcarTodasLeidas}>Marcar todas como leídas</button>
          </div>

          <div className="notif-panel-body">
            {nuevas.length === 0 && todasAnteriores.length === 0 && (
              <p className="empty-state notif-empty">No tenés notificaciones todavía.</p>
            )}

            {nuevasVisibles.length > 0 && (
              <div className="notif-section">
                <span className="notif-section-label">NUEVAS</span>
                {nuevasVisibles.map((n) => (
                  <div key={n.id} className="notif-item is-new">
                    <div className="notif-item-icon"><UserRoundPlus size={16} /></div>
                    <div className="notif-item-body">
                      <div className="notif-item-top">
                        <p className="notif-item-title">{n.title}</p>
                        <span className="notif-item-time">{formatRelativo(n.time)}</span>
                      </div>
                      <p className="notif-item-text">{n.text}</p>
                      <div className="notif-item-actions">
                        <button className="btn-primary notif-action-btn" onClick={() => irATarea(n.task)}>Ver Tarea</button>
                        <button className="btn-ghost notif-action-btn" onClick={() => ignorar(n.id)}>Ignorar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {anterioresVisibles.length > 0 && (
              <div className="notif-section">
                <span className="notif-section-label">ANTERIORES</span>
                {anterioresVisibles.map((n) => (
                  <div key={n.id} className="notif-item">
                    <div className="notif-item-icon is-muted"><CheckCircle2 size={16} /></div>
                    <div className="notif-item-body">
                      <div className="notif-item-top">
                        <p className="notif-item-title">{n.title}</p>
                        <span className="notif-item-time">{formatRelativo(n.time)}</span>
                      </div>
                      <p className="notif-item-text">{n.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="notif-panel-footer"
            onClick={() => { navigate('/app/notifications'); setIsOpen(false); }}
          >
            Ver todas las notificaciones <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
