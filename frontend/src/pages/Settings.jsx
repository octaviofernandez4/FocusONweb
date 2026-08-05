import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Loader2, Building2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { usePageTitle } from '../hooks/usePageTitle';
import { updateProfile } from '../services/profileService';
import { uploadFile } from '../services/uploadService';
import { updateOrg, listMembers, sendTestEmail } from '../services/orgService';
import { orgSchema } from '../schemas/orgSchema';
import ChangePasswordModal from '../components/ChangePasswordModal';
import './Settings.css';

const profileSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  lastname: z.string().min(1, 'El apellido es obligatorio'),
  statusText: z.string().optional(),
});

const getInitials = (name, lastname) => `${name?.[0] || ''}${lastname?.[0] || ''}`.toUpperCase() || '?';

// Botones/campos que todavía no tienen backend real detrás (foto de perfil, 2FA,
// facturación, SSO, etc.) quedan visibles para respetar el diseño, pero avisan
// que no están disponibles en vez de simular que funcionan.
const proximamente = (que) => alert(`Próximamente: ${que}`);

const Settings = () => {
  usePageTitle('Configuración');
  const { user, refreshProfile } = useAuth();
  const { org, isAdmin, projects, refreshOrg } = useOrg();
  // Los ajustes de empresa y de empleado son paneles completamente distintos,
  // igual que el resto de la app (accountType decide, no el rol de Membership).
  const esEmpresa = user?.accountType === 'empresa';
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);

  const profileForm = useForm({ resolver: zodResolver(profileSchema) });
  const orgForm = useForm({ resolver: zodResolver(orgSchema) });

  const cargarMiembros = useCallback(async () => {
    try {
      const data = await listMembers();
      setMembers(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      profileForm.reset({ name: user.name, lastname: user.lastname, statusText: user.statusText || '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (org) {
      orgForm.reset({ name: org.name, industry: org.industry || '', address: org.address || '', taxId: org.taxId || '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarMiembros();
  }, [cargarMiembros]);

  const onSubmitProfile = async (data) => {
    try {
      await updateProfile(data);
      await refreshProfile();
      alert('Perfil actualizado ✏️');
    } catch (error) {
      console.error(error);
      alert('Hubo un error al actualizar el perfil');
    }
  };

  const onSubmitOrg = async (data) => {
    try {
      await updateOrg(data);
      await refreshOrg();
      alert('Organización actualizada ✏️');
    } catch (error) {
      console.error(error);
      alert('Hubo un error al actualizar la organización');
    }
  };

  return (
    <div className={`settings-page ${esEmpresa ? 'settings-page-company' : ''}`}>
      <h1>Configuración</h1>
      <p className="page-subtitle">
        {esEmpresa ? 'Gestioná el perfil de la empresa y tu equipo.' : 'Gestioná tus preferencias de cuenta y tu perfil profesional.'}
      </p>

      {esEmpresa ? (
        <CompanySettings
          isAdmin={isAdmin}
          projects={projects}
          members={members}
          user={user}
          org={org}
          refreshOrg={refreshOrg}
          orgForm={orgForm}
          onSubmitOrg={onSubmitOrg}
          onGestionarEquipo={() => navigate('/app/team')}
          profileForm={profileForm}
          onSubmitProfile={onSubmitProfile}
          refreshProfile={refreshProfile}
        />
      ) : (
        <EmployeeSettings
          user={user}
          isAdmin={isAdmin}
          org={org}
          profileForm={profileForm}
          onSubmitProfile={onSubmitProfile}
          refreshProfile={refreshProfile}
        />
      )}
    </div>
  );
};

// --- Ajustes de cuenta empleado ---
const EmployeeSettings = ({ user, isAdmin, org, profileForm, onSubmitProfile, refreshProfile }) => {
  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const subido = await uploadFile(file);
      await updateProfile({ avatarUrl: subido.url });
      await refreshProfile();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al subir la foto de perfil');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
  <>
  <div className="settings-employee-grid">
    <div className="settings-col-side">
      <section className="card-panel settings-profile-card">
        <div className="settings-avatar-wrap">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Tu foto de perfil" className="settings-avatar settings-avatar-img" />
          ) : (
            <div className="settings-avatar">{getInitials(user?.name, user?.lastname)}</div>
          )}
          <button
            type="button"
            className="settings-avatar-edit"
            title="Cambiar foto"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? <Loader2 size={12} className="settings-avatar-spinner" /> : <Pencil size={12} />}
          </button>
          <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg" hidden onChange={handleAvatarChange} />
        </div>
        <h2 className="settings-profile-name">{user ? `${user.name} ${user.lastname}` : '…'}</h2>
        <p className="settings-profile-role">{user?.statusText || 'Enfocado'}</p>
        <span className="pill pill-neutral settings-profile-org">{org?.name || 'Tu empresa'}</span>
      </section>

      <section className="card-panel settings-section">
        <h3>Detalles profesionales</h3>
        <div className="form-group">
          <label>Rol</label>
          <input type="text" disabled value={isAdmin ? 'Administrador' : 'Miembro'} />
        </div>
        <div className="form-group">
          <label>Departamento</label>
          <input type="text" disabled placeholder="No configurado" />
        </div>
        <div className="form-group">
          <label>ID de empleado</label>
          <input type="text" disabled placeholder="No disponible" />
        </div>
      </section>
    </div>

    <div className="settings-col-main">
      <section className="card-panel settings-section">
        <h3>Información personal</h3>
        <form onSubmit={profileForm.handleSubmit(onSubmitProfile)}>
          <div className="settings-form-row">
            <div className="form-group">
              <label>Nombre</label>
              <input type="text" {...profileForm.register('name')} />
              <span className="error-text">{profileForm.formState.errors.name?.message}</span>
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input type="text" {...profileForm.register('lastname')} />
              <span className="error-text">{profileForm.formState.errors.lastname?.message}</span>
            </div>
          </div>
          <div className="settings-form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" disabled value={user?.email || ''} />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input type="text" disabled placeholder="No disponible" />
            </div>
          </div>
          <div className="form-group">
            <label>Estado</label>
            <input type="text" placeholder="Ej: Enfocado" {...profileForm.register('statusText')} />
            <span className="error-text">{profileForm.formState.errors.statusText?.message}</span>
          </div>
          <button type="submit" className="btn-primary settings-submit">Guardar perfil</button>
        </form>
      </section>

      <section className="card-panel settings-section">
        <h3>Preferencias de cuenta</h3>
        <div className="settings-form-row">
          <div className="form-group">
            <label>Idioma</label>
            <select disabled defaultValue="es-AR">
              <option value="es-AR">Español (Argentina)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Zona horaria</label>
            <select disabled defaultValue="ar">
              <option value="ar">Argentina (GMT-3)</option>
            </select>
          </div>
        </div>
        <div className="settings-toggle-row">
          <div>
            <p className="settings-toggle-label">Notificaciones por email</p>
            <span className="settings-toggle-hint">Recibí resúmenes diarios y alertas importantes.</span>
          </div>
          <span className="settings-toggle is-on" title="Próximamente" />
        </div>
      </section>

      <section className="card-panel settings-section">
        <h3>Seguridad</h3>
        <div className="settings-security-row">
          <div>
            <p className="settings-toggle-label">Contraseña</p>
            <span className="settings-toggle-hint">Mantené tu cuenta protegida con una contraseña segura.</span>
          </div>
          <button type="button" className="btn-ghost" onClick={() => setModalPasswordAbierto(true)}>Cambiar contraseña</button>
        </div>
        <div className="settings-security-row">
          <div>
            <p className="settings-toggle-label">Verificación en dos pasos (2FA)</p>
            <span className="settings-toggle-hint">Sumá una capa extra de seguridad a tu cuenta.</span>
          </div>
          <button type="button" className="btn-ghost" onClick={() => proximamente('la verificación en dos pasos')}>Activar 2FA</button>
        </div>
      </section>
    </div>
  </div>
  <ChangePasswordModal isOpen={modalPasswordAbierto} onClose={() => setModalPasswordAbierto(false)} />
  </>
  );
};

// --- Ajustes de cuenta empresa ---
const CompanySettings = ({ isAdmin, projects, members, user, org, refreshOrg, orgForm, onSubmitOrg, onGestionarEquipo, profileForm, onSubmitProfile, refreshProfile }) => {
  const logoInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [notifEmail, setNotifEmail] = useState('');
  const [notifPassword, setNotifPassword] = useState('');
  const [isSavingNotif, setIsSavingNotif] = useState(false);
  const [isTestingNotif, setIsTestingNotif] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotifEmail(org?.notificationEmail || '');
  }, [org?.notificationEmail]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const subido = await uploadFile(file);
      await updateProfile({ avatarUrl: subido.url });
      await refreshProfile();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al subir la foto de perfil');
    } finally {
      setIsUploadingAvatar(false);
    }
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

  const handleSubmitNotif = async (e) => {
    e.preventDefault();
    setIsSavingNotif(true);
    try {
      await updateOrg({ name: org?.name, notificationEmail: notifEmail.trim(), notificationEmailAppPassword: notifPassword.trim() });
      await refreshOrg();
      setNotifPassword('');
      alert('Email de notificaciones actualizado ✏️');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al guardar el email de notificaciones');
    } finally {
      setIsSavingNotif(false);
    }
  };

  const handleProbarNotif = async () => {
    setIsTestingNotif(true);
    try {
      const data = await sendTestEmail();
      await refreshOrg();
      alert(data.mensaje);
    } catch (error) {
      console.error(error);
      await refreshOrg();
      alert(error.response?.data?.mensaje || 'Hubo un error al mandar el email de prueba');
    } finally {
      setIsTestingNotif(false);
    }
  };

  const handleQuitarNotif = async () => {
    if (!confirm('¿Dejar de enviar los emails automáticos de tareas asignadas?')) return;
    setIsSavingNotif(true);
    try {
      await updateOrg({ name: org?.name, notificationEmail: '', notificationEmailAppPassword: '' });
      await refreshOrg();
      setNotifEmail('');
      setNotifPassword('');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al quitar la configuración');
    } finally {
      setIsSavingNotif(false);
    }
  };

  return (
  <>
  <div className="settings-company-grid">
    <section className="card-panel settings-section settings-span-2">
      <h3>Tu perfil personal</h3>
      <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="settings-company-form">
        <div className="settings-avatar-wrap">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Tu foto de perfil" className="settings-avatar settings-avatar-img" />
          ) : (
            <div className="settings-avatar">{getInitials(user?.name, user?.lastname)}</div>
          )}
          <button
            type="button"
            className="settings-avatar-edit"
            title="Cambiar foto"
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? <Loader2 size={12} className="settings-avatar-spinner" /> : <Pencil size={12} />}
          </button>
          <input ref={avatarInputRef} type="file" accept=".png,.jpg,.jpeg" hidden onChange={handleAvatarChange} />
        </div>
        <div className="settings-company-fields">
          <div className="settings-form-row">
            <div className="form-group">
              <label>Nombre</label>
              <input type="text" {...profileForm.register('name')} />
              <span className="error-text">{profileForm.formState.errors.name?.message}</span>
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input type="text" {...profileForm.register('lastname')} />
              <span className="error-text">{profileForm.formState.errors.lastname?.message}</span>
            </div>
          </div>
          <div className="settings-form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" disabled value={user?.email || ''} />
            </div>
            <div className="form-group">
              <label>Estado</label>
              <input type="text" placeholder="Ej: Enfocado" {...profileForm.register('statusText')} />
              <span className="error-text">{profileForm.formState.errors.statusText?.message}</span>
            </div>
          </div>
          <button type="submit" className="btn-primary settings-submit">Guardar perfil</button>
        </div>
      </form>
    </section>

    <section className="card-panel settings-section settings-span-2">
      <h3>Perfil de la empresa</h3>
      <form onSubmit={orgForm.handleSubmit(onSubmitOrg)} className="settings-company-form">
        <div className="settings-company-avatar-wrap">
          {org?.logoUrl ? (
            <img src={org.logoUrl} alt="Logo de la empresa" className="settings-avatar settings-company-avatar settings-avatar-img" />
          ) : (
            <div className="settings-avatar settings-company-avatar"><Building2 size={26} /></div>
          )}
          {isAdmin && (
            <button
              type="button"
              className="settings-avatar-edit"
              title="Cambiar logo"
              onClick={() => logoInputRef.current?.click()}
              disabled={isUploadingLogo}
            >
              {isUploadingLogo ? <Loader2 size={12} className="settings-avatar-spinner" /> : <Pencil size={12} />}
            </button>
          )}
          <input ref={logoInputRef} type="file" accept=".png,.jpg,.jpeg" hidden onChange={handleLogoChange} />
        </div>
        <div className="settings-company-fields">
          <div className="settings-form-row">
            <div className="form-group">
              <label>Nombre de la empresa</label>
              <input type="text" disabled={!isAdmin} {...orgForm.register('name')} />
              <span className="error-text">{orgForm.formState.errors.name?.message}</span>
            </div>
            <div className="form-group">
              <label>Rubro</label>
              <input type="text" disabled={!isAdmin} placeholder="Ej: Tecnología" {...orgForm.register('industry')} />
            </div>
          </div>
          <div className="settings-form-row">
            <div className="form-group">
              <label>Dirección</label>
              <input type="text" disabled={!isAdmin} placeholder="Ej: Av. Corrientes 1234, CABA" {...orgForm.register('address')} />
            </div>
            <div className="form-group">
              <label>CUIT / Tax ID</label>
              <input type="text" disabled={!isAdmin} placeholder="Ej: 30-12345678-9" {...orgForm.register('taxId')} />
            </div>
          </div>
          {isAdmin && <button type="submit" className="btn-primary settings-submit">Guardar cambios</button>}
        </div>
      </form>
    </section>

    <section className="card-panel settings-section settings-span-2">
      <h3>Email para notificaciones automáticas</h3>
      <p className="settings-hint">
        Cuando le asignás una tarea a alguien, le llega un email avisándole — sale desde este Gmail, como si lo mandaras vos.
        Necesitás una <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">contraseña de aplicación</a> de Google, no tu contraseña normal.
      </p>
      {org?.notificationEmailLastError && (
        <p className="settings-notif-warning">
          <AlertTriangle size={14} />
          Falló el último envío ({new Date(org.notificationEmailLastErrorAt).toLocaleString('es-AR')}): {org.notificationEmailLastError}
        </p>
      )}
      <form onSubmit={handleSubmitNotif}>
        <div className="settings-form-row">
          <div className="form-group">
            <label>Gmail de la empresa</label>
            <input
              type="email"
              disabled={!isAdmin}
              placeholder="jefe@empresa.com"
              value={notifEmail}
              onChange={(e) => setNotifEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Contraseña de aplicación</label>
            <input
              type="password"
              disabled={!isAdmin}
              placeholder={org?.notificationEmail ? '••••••••••••••••' : 'abcd efgh ijkl mnop'}
              value={notifPassword}
              onChange={(e) => setNotifPassword(e.target.value)}
            />
          </div>
        </div>
        {isAdmin && (
          <div className="settings-notif-actions">
            <button type="submit" className="btn-primary settings-submit" disabled={isSavingNotif || !notifEmail}>
              Guardar
            </button>
            {org?.notificationEmail && (
              <>
                <button type="button" className="btn-ghost" onClick={handleProbarNotif} disabled={isTestingNotif}>
                  {isTestingNotif ? 'Probando…' : 'Probar'}
                </button>
                <button type="button" className="btn-ghost" onClick={handleQuitarNotif} disabled={isSavingNotif}>
                  Quitar
                </button>
              </>
            )}
          </div>
        )}
      </form>
    </section>

    <section className="card-panel settings-section">
      <h3>Seguridad</h3>
      <div className="settings-security-row">
        <div>
          <p className="settings-toggle-label">Contraseña</p>
          <span className="settings-toggle-hint">Mantené tu cuenta protegida con una contraseña segura.</span>
        </div>
        <button type="button" className="btn-ghost" onClick={() => setModalPasswordAbierto(true)}>Cambiar contraseña</button>
      </div>
    </section>

    <section className="card-panel settings-section">
      <h3>Resumen del equipo</h3>
      <div className="settings-stats-row">
        <div>
          <p className="settings-stat-value">{members.length}</p>
          <span className="settings-stat-label">Miembros activos</span>
        </div>
        <div>
          <p className="settings-stat-value">{projects.length}</p>
          <span className="settings-stat-label">Proyectos</span>
        </div>
      </div>
      <button type="button" className="btn-ghost settings-full-btn" onClick={onGestionarEquipo}>Gestionar equipo</button>
    </section>
  </div>
  <ChangePasswordModal isOpen={modalPasswordAbierto} onClose={() => setModalPasswordAbierto(false)} />
  </>
  );
};

export default Settings;
