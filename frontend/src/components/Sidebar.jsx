import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Inbox, ListChecks, CheckCircle2, XCircle, BarChart3, FolderKanban, Settings, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import './Sidebar.css';

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/mytasks', label: 'Mis tareas', icon: ListChecks },
  { to: '/app/inbox', label: 'Tareas del equipo', icon: Inbox },
  { to: '/app/completed', label: 'Completadas', icon: CheckCircle2 },
  { to: '/app/incomplete', label: 'Incompletas', icon: XCircle },
  { to: '/app/projects', label: 'Proyectos', icon: FolderKanban },
  { to: '/app/analytics', label: 'Analíticas', icon: BarChart3 },
];

const Sidebar = () => {
  const { logout } = useAuth();
  const { org } = useOrg();
  const navigate = useNavigate();

  const cerrarSesion = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-company">
        {org?.logoUrl ? (
          <img src={org.logoUrl} alt="Logo de la empresa" className="sidebar-company-logo" />
        ) : (
          <div className="sidebar-company-logo sidebar-company-logo-placeholder">
            <Building2 size={44} />
          </div>
        )}
        <p className="sidebar-company-name">{org?.name || 'Tu empresa'}</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'is-active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/app/settings" className={({ isActive }) => `sidebar-footer-link ${isActive ? 'is-active' : ''}`}>
          <Settings size={16} /> Configuración
        </NavLink>
        <button className="sidebar-logout" onClick={cerrarSesion}>
          <LogOut size={16} /> Salir
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
