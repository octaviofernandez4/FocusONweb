import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Inbox, CheckCircle2, FolderKanban, BarChart3, Settings, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import NotificationsPanel from './NotificationsPanel';
import './CompanyNavbar.css';

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/today', label: 'Hoy', icon: CalendarCheck },
  { to: '/app/inbox', label: 'Tareas del equipo', icon: Inbox },
  { to: '/app/completed', label: 'Completadas', icon: CheckCircle2 },
  { to: '/app/projects', label: 'Proyectos', icon: FolderKanban },
  { to: '/app/analytics', label: 'Analíticas', icon: BarChart3 },
  { to: '/app/settings', label: 'Configuración', icon: Settings },
];

const getInitials = (name, lastname) =>
  `${name?.[0] || ''}${lastname?.[0] || ''}`.toUpperCase() || '?';

// Navbar horizontal completo de la cuenta empresa — sin sidebar, a propósito
// bien distinto del layout de la cuenta empleado.
const CompanyNavbar = () => {
  const { user, logout } = useAuth();
  const { org } = useOrg();
  const navigate = useNavigate();

  const cerrarSesion = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="company-navbar">
      <div className="company-navbar-top">
        <span className="company-navbar-user">{user ? `${user.name} ${user.lastname}` : '…'}</span>
        <span className="company-navbar-org">{org?.name || 'Tu empresa'}</span>
        <div className="company-navbar-actions">
          <NotificationsPanel />
          <button className="icon-btn" title="Ayuda">
            <HelpCircle size={17} />
          </button>
          <div className="company-navbar-avatar">{getInitials(user?.name, user?.lastname)}</div>
          <button className="icon-btn" title="Salir" onClick={cerrarSesion}>
            <LogOut size={17} />
          </button>
        </div>
      </div>

      <nav className="company-navbar-links">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `company-navbar-link ${isActive ? 'is-active' : ''}`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
};

export default CompanyNavbar;
