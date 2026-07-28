import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link2, Copy, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { updateProfile } from '../services/profileService';
import { updateOrg, generateInvite, listMembers } from '../services/orgService';
import { orgSchema } from '../schemas/orgSchema';
import './Settings.css';

const profileSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  lastname: z.string().min(1, 'El apellido es obligatorio'),
  statusText: z.string().optional(),
});

const Settings = () => {
  const { user, refreshProfile } = useAuth();
  const { org, isAdmin, refreshOrg } = useOrg();
  // La invitación es solo para cuentas "empresa" — un empleado autoregistrado
  // sin invitación es técnicamente admin de su propia org placeholder, pero
  // no por eso debe ver la opción de invitar (el backend también lo bloquea).
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
      orgForm.reset({ name: org.name });
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
      <p className="page-subtitle">Gestioná tu perfil, tu organización y tu equipo.</p>

      <div className="settings-grid">
        <section className="card-panel settings-section">
          <h2>Mi perfil</h2>
          <form onSubmit={profileForm.handleSubmit(onSubmitProfile)}>
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
            <div className="form-group">
              <label>Estado</label>
              <input type="text" placeholder="Ej: Enfocado" {...profileForm.register('statusText')} />
              <span className="error-text">{profileForm.formState.errors.statusText?.message}</span>
            </div>
            <button type="submit" className="btn-primary">Guardar perfil</button>
          </form>
        </section>

        <section className="card-panel settings-section">
          <h2>Organización</h2>
          <form onSubmit={orgForm.handleSubmit(onSubmitOrg)}>
            <div className="form-group">
              <label>Nombre de la organización</label>
              <input type="text" disabled={!isAdmin} {...orgForm.register('name')} />
              <span className="error-text">{orgForm.formState.errors.name?.message}</span>
            </div>
            {isAdmin ? (
              <button type="submit" className="btn-primary">Guardar organización</button>
            ) : (
              <p className="settings-hint">Solo un admin puede renombrar la organización.</p>
            )}
          </form>

          {esEmpresa && (
            <div className="settings-invite">
              <button type="button" className="btn-ghost" onClick={handleGenerateInvite}>
                <Link2 size={16} /> Generar link de invitación
              </button>
              {inviteUrl && (
                <div className="invite-url-row">
                  <input type="text" readOnly value={inviteUrl} />
                  <button type="button" className="icon-btn" onClick={handleCopy} title="Copiar">
                    {copied ? <Check size={16} className="icon-success" /> : <Copy size={16} />}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="card-panel settings-section settings-members">
          <h2>Miembros del equipo</h2>
          {members.length === 0 ? (
            <p className="empty-state">Todavía no hay miembros para mostrar.</p>
          ) : (
            <ul className="member-list">
              {members.map((m) => (
                <li key={m.id}>
                  <div>
                    <p className="member-name">{m.name} {m.lastname}</p>
                    <span className="member-email">{m.email}</span>
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
    </div>
  );
};

export default Settings;
