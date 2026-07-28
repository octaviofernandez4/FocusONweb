import { Search, HelpCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import NotificationsPanel from './NotificationsPanel';
import './TopBar.css';

const getInitials = (name, lastname) =>
  `${name?.[0] || ''}${lastname?.[0] || ''}`.toUpperCase() || '?';

// Barra superior de la cuenta empleado — la búsqueda es decorativa por ahora
// (todavía no hay un endpoint de búsqueda global).
const TopBar = () => {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={16} />
        <input type="text" placeholder="Buscar tareas, proyectos o personas…" disabled />
      </div>

      <div className="topbar-actions">
        <NotificationsPanel />
        <button className="icon-btn" title="Ayuda">
          <HelpCircle size={17} />
        </button>
        <div className="topbar-avatar">{getInitials(user?.name, user?.lastname)}</div>
      </div>
    </header>
  );
};

export default TopBar;
