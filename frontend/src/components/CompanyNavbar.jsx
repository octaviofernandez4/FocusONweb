import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Inbox, CheckCircle2, FolderKanban, Settings, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import NotificationsPanel from './NotificationsPanel';
import Modal from './Modal';
import './CompanyNavbar.css';

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/inbox', label: 'Tareas del equipo', icon: Inbox },
  { to: '/app/completed', label: 'Completadas', icon: CheckCircle2 },
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

  const cerrarSesion = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="company-navbar">
      <div className="company-navbar-top">
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
