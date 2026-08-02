import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Inbox, CheckCircle2, XCircle, FolderKanban, Settings, LogOut, Building2, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import NotificationsPanel from './NotificationsPanel';
import Modal from './Modal';
import './CompanyNavbar.css';

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/inbox', label: 'Tareas del equipo', icon: Inbox },
  { to: '/app/completed', label: 'Completadas', icon: CheckCircle2 },
  { to: '/app/incomplete', label: 'Incompletas', icon: XCircle },
  { to: '/app/projects', label: 'Proyectos', icon: FolderKanban },
  { to: '/app/settings', label: 'Configuración', icon: Settings },
];

// Navbar horizontal completo de la cuenta empresa — sin sidebar, a propósito
// bien distinto del layout de la cuenta empleado.
const CompanyNavbar = () => {
  const { logout } = useAuth();
  const { org } = useOrg();
  const navigate = useNavigate();
  const [confirmandoSalida, setConfirmandoSalida] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);
  useBodyScrollLock(isMenuOpen);

  const cerrarSesion = () => {
    closeMenu();
    logout();
    navigate('/login');
  };

  return (
    <header className="company-navbar">
      <div className="company-navbar-top">
        <button className="company-navbar-hamburger" onClick={() => setIsMenuOpen(true)} aria-label="Abrir menú">
          <Menu size={20} />
        </button>

        <div className="company-navbar-logo-wrap">
          {org?.logoUrl ? (
            <img src={org.logoUrl} alt="Logo de la empresa" className="company-navbar-logo" />
          ) : (
            <div className="company-navbar-logo company-navbar-logo-placeholder">
              <Building2 size={30} />
            </div>
          )}
        </div>

        <nav className="company-navbar-links">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `company-navbar-link ${isActive ? 'is-active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="company-navbar-actions">
          <NotificationsPanel />
          <button
            className="icon-btn icon-btn-danger"
            title="Salir"
            onClick={() => setConfirmandoSalida(true)}
          >
            <LogOut size={19} />
          </button>
        </div>
      </div>

      {isMenuOpen && <div className="company-navbar-backdrop" onClick={closeMenu} />}

      <nav className={`company-navbar-drawer ${isMenuOpen ? 'is-open' : ''}`}>
        <div className="company-navbar-drawer-header">
          <span>{org?.name || 'Tu empresa'}</span>
          <button className="company-navbar-drawer-close" onClick={closeMenu} aria-label="Cerrar menú">
            <X size={20} />
          </button>
        </div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={closeMenu}
            className={({ isActive }) => `company-navbar-drawer-link ${isActive ? 'is-active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          className="company-navbar-drawer-link company-navbar-drawer-logout"
          onClick={() => { closeMenu(); setConfirmandoSalida(true); }}
        >
          <LogOut size={18} /> <span>Salir</span>
        </button>
      </nav>

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
    </header>
  );
};

export default CompanyNavbar;
