import { useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Inbox, CheckCircle2, FolderKanban, BarChart3, Settings, LogOut, Building2, Pencil } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { updateOrg } from '../services/orgService';
import { uploadFile } from '../services/uploadService';
import NotificationsPanel from './NotificationsPanel';
import './CompanyNavbar.css';

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/inbox', label: 'Tareas del equipo', icon: Inbox },
  { to: '/app/completed', label: 'Completadas', icon: CheckCircle2 },
  { to: '/app/projects', label: 'Proyectos', icon: FolderKanban },
  { to: '/app/analytics', label: 'Analíticas', icon: BarChart3 },
  { to: '/app/settings', label: 'Configuración', icon: Settings },
];

// Navbar horizontal completo de la cuenta empresa — sin sidebar, a propósito
// bien distinto del layout de la cuenta empleado.
const CompanyNavbar = () => {
  const { logout } = useAuth();
  const { org, refreshOrg } = useOrg();
  const navigate = useNavigate();
  const logoInputRef = useRef(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const cerrarSesion = () => {
    logout();
    navigate('/login');
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const subido = await uploadFile(file);
      await updateOrg({ name: org?.name, logoUrl: subido.url });
      await refreshOrg();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al subir el logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <header className="company-navbar">
      <div className="company-navbar-top">
        <div className="company-navbar-logo-wrap">
          {org?.logoUrl ? (
            <img src={org.logoUrl} alt="Logo de la empresa" className="company-navbar-logo" />
          ) : (
            <div className="company-navbar-logo company-navbar-logo-placeholder">
              <Building2 size={18} />
            </div>
          )}
          <button
            type="button"
            className="company-navbar-logo-edit"
            title="Cambiar logo"
            onClick={() => logoInputRef.current?.click()}
            disabled={isUploadingLogo}
          >
            <Pencil size={13} />
          </button>
          <input
            ref={logoInputRef}
            type="file"
            accept=".png,.jpg,.jpeg"
            hidden
            onChange={handleLogoChange}
          />
        </div>

        <span className="company-navbar-org">{org?.name || 'Tu empresa'}</span>

        <div className="company-navbar-actions">
          <NotificationsPanel />
          <button className="icon-btn" title="Salir" onClick={cerrarSesion}>
            <LogOut size={19} />
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
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
};

export default CompanyNavbar;
