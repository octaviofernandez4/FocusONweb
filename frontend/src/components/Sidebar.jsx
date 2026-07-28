import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Inbox, CalendarCheck, ListChecks, CheckCircle2, BarChart3, FolderKanban, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { getProjectColor } from '../utils/projectColors';
import './Sidebar.css';

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/mytasks', label: 'Mis tareas', icon: ListChecks },
  { to: '/app/today', label: 'Hoy', icon: CalendarCheck },
  { to: '/app/inbox', label: 'Tareas del equipo', icon: Inbox },
  { to: '/app/completed', label: 'Completadas', icon: CheckCircle2 },
  { to: '/app/projects', label: 'Proyectos', icon: FolderKanban },
  { to: '/app/analytics', label: 'Analíticas', icon: BarChart3 },
];

const getInitials = (name, lastname) =>
  `${name?.[0] || ''}${lastname?.[0] || ''}`.toUpperCase() || '?';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { projects } = useOrg();
  const navigate = useNavigate();

  const cerrarSesion = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-profile">
        <div className="sidebar-avatar">{getInitials(user?.name, user?.lastname)}</div>
        <div>
          <p className="sidebar-username">{user ? `${user.name} ${user.lastname}` : '…'}</p>
          <p className="sidebar-status">{user?.statusText || 'Enfocado'}</p>
        </div>
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

      {projects.length > 0 && (
        <div className="sidebar-projects">
          <p className="sidebar-section-title">Proyectos</p>
          {projects.map((project) => {
            const color = getProjectColor(project.color);
            return (
              <NavLink key={project._id} to={`/app/projects?id=${project._id}`} className="sidebar-project-item">
                <span className="sidebar-project-dot" style={{ background: color.dot }} />
                {project.name}
              </NavLink>
            );
          })}
        </div>
      )}

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
