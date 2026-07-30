import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Link2, Copy, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { updateProfile } from '../services/profileService';
import { uploadFile } from '../services/uploadService';
import { updateOrg, generateInvite, listMembers } from '../services/orgService';
import { orgSchema } from '../schemas/orgSchema';
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
  const { user, refreshProfile } = useAuth();
  const { org, isAdmin, projects, refreshOrg } = useOrg();
  // Los ajustes de empresa y de empleado son paneles completamente distintos,
  // igual que el resto de la app (accountType decide, no el rol de Membership).
  const esEmpresa = user?.accountType === 'empresa';
  const [members, setMembers] = useState([]);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

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
      orgForm.reset({ name: org.name, industry: org.industry || '', address: org.address || '' });
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

  const handleGenerateInvite = async () => {
    try {
      const data = await generateInvite();
      setInviteUrl(data.inviteUrl);
      setCopied(false);
    } catch (error) {
      console.error(error);
      alert('Hubo un error al generar la invitación');
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="settings-page">
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
          orgForm={orgForm}
          onSubmitOrg={onSubmitOrg}
          inviteUrl={inviteUrl}
          copied={copied}
          onGenerateInvite={handleGenerateInvite}
          onCopy={handleCopy}
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
          <button type="button" className="btn-ghost" onClick={() => proximamente('el cambio de contraseña')}>Cambiar contraseña</button>
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
  );
};

// --- Ajustes de cuenta empresa ---
const CompanySettings = ({ isAdmin, projects, members, user, orgForm, onSubmitOrg, inviteUrl, copied, onGenerateInvite, onCopy }) => (
  <div className="settings-company-grid">
    <section className="card-panel settings-section settings-span-2">
      <h3>Perfil de la empresa</h3>
      <form onSubmit={orgForm.handleSubmit(onSubmitOrg)} className="settings-company-form">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="Tu foto de perfil" className="settings-avatar settings-company-avatar settings-avatar-img" />
        ) : (
          <div className="settings-avatar settings-company-avatar">{getInitials(user?.name, user?.lastname)}</div>
        )}
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
          <div className="form-group">
            <label>Dirección</label>
            <input type="text" disabled={!isAdmin} placeholder="Ej: Av. Corrientes 1234, CABA" {...orgForm.register('address')} />
          </div>
          {isAdmin && <button type="submit" className="btn-primary settings-submit">Guardar cambios</button>}
        </div>
      </form>
    </section>

    <section className="card-panel settings-section">
      <h3>Datos de la organización</h3>
      <div className="form-group">
        <label>CUIT / Tax ID</label>
        <input type="text" disabled placeholder="No disponible" />
      </div>
      <div className="form-group">
        <label>Contacto principal</label>
        <input type="text" disabled value={user ? `${user.name} ${user.lastname}` : ''} />
      </div>
      <div className="form-group">
        <label>Email oficial</label>
        <input type="email" disabled value={user?.email || ''} />
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
      <button type="button" className="btn-ghost settings-full-btn" onClick={() => proximamente('la gestión avanzada de equipo')}>Gestionar equipo</button>
    </section>

    <section className="card-panel settings-section settings-span-2">
      <div className="settings-section-header">
        <h3>Miembros del equipo</h3>
        <button type="button" className="btn-ghost" onClick={onGenerateInvite}>
          <Link2 size={16} /> Generar link de invitación
        </button>
      </div>

      {inviteUrl && (
        <div className="invite-url-row">
          <input type="text" readOnly value={inviteUrl} />
          <button type="button" className="icon-btn" onClick={onCopy} title="Copiar">
            {copied ? <Check size={16} className="icon-success" /> : <Copy size={16} />}
          </button>
        </div>
      )}

      {members.length === 0 ? (
        <p className="empty-state">Todavía no hay miembros para mostrar.</p>
      ) : (
        <ul className="member-list">
          {members.map((m) => (
            <li key={m.id}>
              <div className="member-info">
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt={`Foto de ${m.name}`} className="member-avatar member-avatar-img" />
                ) : (
                  <div className="member-avatar">{getInitials(m.name, m.lastname)}</div>
                )}
                <div>
                  <p className="member-name">{m.name} {m.lastname}</p>
                  <span className="member-email">{m.email}</span>
                </div>
              </div>
              <span className={`pill ${m.role === 'admin' ? 'pill-indigo' : 'pill-neutral'}`}>
                {m.role === 'admin' ? 'ADMIN' : 'MIEMBRO'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  </div>
);

export default Settings;
