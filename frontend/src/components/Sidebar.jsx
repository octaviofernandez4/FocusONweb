import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Inbox, ListChecks, CheckCircle2, XCircle, BarChart3, FolderKanban, Settings, LogOut, Building2, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import Modal from './Modal';
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
  const [isOpen, setIsOpen] = useState(false);
  const [confirmandoSalida, setConfirmandoSalida] = useState(false);
  const closeDrawer = () => setIsOpen(false);
  useBodyScrollLock(isOpen);

  const pedirCerrarSesion = () => {
    closeDrawer();
    setConfirmandoSalida(true);
  };

  const cerrarSesion = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className="sidebar-mobile-bar">
        <button className="sidebar-hamburger" onClick={() => setIsOpen(true)} aria-label="Abrir menú">
          <Menu size={20} />
        </button>
        <p className="sidebar-mobile-title">{org?.name || 'Tu empresa'}</p>
      </div>

      {isOpen && <div className="sidebar-backdrop" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
        <button className="sidebar-close" onClick={() => setIsOpen(false)} aria-label="Cerrar menú">
          <X size={20} />
        </button>

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
              onClick={closeDrawer}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'is-active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/app/settings" onClick={closeDrawer} className={({ isActive }) => `sidebar-footer-link ${isActive ? 'is-active' : ''}`}>
            <Settings size={16} /> Configuración
          </NavLink>
          <button className="sidebar-logout" onClick={pedirCerrarSesion}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      </aside>

      <Modal isOpen={confirmandoSalida} onClose={() => setConfirmandoSalida(false)} title="Cerrar sesión">
        <div className="confirm-logout">
          <div className="confirm-logout-icon"><LogOut size={24} /></div>
          <h3>¿Cerrar sesión?</h3>
          <p>Vas a salir de tu cuenta en {org?.name || 'tu empresa'}. Podés volver a iniciar sesión cuando quieras.</p>
          <div className="confirm-logout-actions">
            <button className="btn-ghost" onClick={() => setConfirmandoSalida(false)}>Cancelar</button>
            <button className="btn-danger" onClick={cerrarSesion}>Sí, cerrar sesión</button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Sidebar;
