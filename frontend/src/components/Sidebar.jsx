import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Inbox, CalendarCheck, CheckCircle2, Settings, Plus, HelpCircle, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { createProject } from '../services/projectService';
import { projectSchema } from '../schemas/projectSchema';
import { PROJECT_COLOR_KEYS, nextProjectColor, getProjectColor } from '../utils/projectColors';
import Modal from './Modal';
import './Sidebar.css';

const navItems = [
  { to: '/app/today', label: 'Hoy', icon: CalendarCheck },
  { to: '/app/inbox', label: 'Bandeja', icon: Inbox },
  { to: '/app/completed', label: 'Completadas', icon: CheckCircle2 },
  { to: '/app/settings', label: 'Configuración', icon: Settings },
];

const getInitials = (name, lastname) =>
  `${name?.[0] || ''}${lastname?.[0] || ''}`.toUpperCase() || '?';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { projects, refreshOrg } = useOrg();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: { color: nextProjectColor(projects.length) }
  });

  const cerrarSesion = () => {
    logout();
    navigate('/login');
  };

  const abrirModal = () => {
    reset({ name: '', color: nextProjectColor(projects.length) });
    setIsModalOpen(true);
  };

  const onSubmitProyecto = async (data) => {
    try {
      await createProject(data);
      await refreshOrg();
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al crear el proyecto');
    }
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

      <button className="btn-primary sidebar-new-project" onClick={abrirModal}>
        <Plus size={18} /> Nuevo proyecto
      </button>

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
              <div key={project._id} className="sidebar-project-item">
                <span className="sidebar-project-dot" style={{ background: color.dot }} />
                {project.name}
              </div>
            );
          })}
        </div>
      )}

      <div className="sidebar-footer">
        <a href="#help" onClick={(e) => e.preventDefault()}>
          <HelpCircle size={16} /> Ayuda
        </a>
        <a href="#privacy" onClick={(e) => e.preventDefault()}>
          <ShieldCheck size={16} /> Privacidad
        </a>
        <button className="sidebar-logout" onClick={cerrarSesion}>
          <LogOut size={16} /> Salir
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo proyecto">
        <form onSubmit={handleSubmit(onSubmitProyecto)}>
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" placeholder="Ej: Marketing" {...register('name')} className={errors.name ? 'input-error' : ''} />
            <span className="error-text">{errors.name?.message}</span>
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-picker">
              {PROJECT_COLOR_KEYS.map((key) => (
                <label key={key} className="color-swatch-label">
                  <input type="radio" value={key} {...register('color')} />
                  <span className="color-swatch" style={{ background: getProjectColor(key).dot }} />
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creando…' : 'Crear proyecto'}
          </button>
        </form>
      </Modal>
    </aside>
  );
};

export default Sidebar;
