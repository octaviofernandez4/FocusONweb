import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Rocket, Mail, Lock, Check, Copy, Send } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';
import { createProject } from '../services/projectService';
import { getCurrentOrg, generateInvite, updateOrg } from '../services/orgService';
import { updateProfile } from '../services/profileService';
import { PROJECT_COLOR_KEYS, nextProjectColor, getProjectColor } from '../utils/projectColors';
import logo from '../assets/focusonweb-logo.png';
import '../components/NewProjectModal.css';
import './Onboarding.css';

const TOTAL_PASOS = 5;

// Wizard de bienvenida para una cuenta empresa recién creada (no para quien se
// une por invitación — a esos no les hace falta crear proyecto ni invitar a
// nadie). Cada paso hace una acción real contra el backend; "Omitir" salta el
// paso sin guardar nada, y "Omitir configuración" corta el wizard entero.
const Onboarding = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  usePageTitle('Bienvenida');

  const [paso, setPaso] = useState(1);
  const [org, setOrg] = useState(null);

  const [nombreProyecto, setNombreProyecto] = useState('');
  const [colorProyecto, setColorProyecto] = useState(nextProjectColor(0));
  const [creandoProyecto, setCreandoProyecto] = useState(false);
  const [proyectoCreado, setProyectoCreado] = useState(false);

  const [emailInvitado, setEmailInvitado] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [invitando, setInvitando] = useState(false);
  const [inviteEnviado, setInviteEnviado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const [notifEmail, setNotifEmail] = useState('');
  const [notifPassword, setNotifPassword] = useState('');
  const [guardandoNotif, setGuardandoNotif] = useState(false);
  const [notifConfigurada, setNotifConfigurada] = useState(false);

  const [finalizando, setFinalizando] = useState(false);

  useEffect(() => {
    getCurrentOrg().then((data) => setOrg(data.organizacion)).catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    if (paso === 3 && !inviteUrl) {
      generateInvite().then((data) => setInviteUrl(data.inviteUrl)).catch((error) => console.error(error));
    }
  }, [paso, inviteUrl]);

  // Ya completó el wizard antes (o es una cuenta que no lo necesita) — no tiene sentido mostrárselo.
  if (user?.onboardingCompleted) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const avanzar = () => setPaso((p) => Math.min(p + 1, TOTAL_PASOS));
  const retroceder = () => setPaso((p) => Math.max(p - 1, 1));

  const finalizarOnboarding = async () => {
    setFinalizando(true);
    try {
      await updateProfile({ onboardingCompleted: true });
      await refreshProfile();
    } catch (error) {
      console.error(error);
    } finally {
      setFinalizando(false);
    }
    navigate('/app/dashboard');
  };

  const handleCrearProyecto = async (e) => {
    e.preventDefault();
    if (!nombreProyecto.trim()) return;
    setCreandoProyecto(true);
    try {
      await createProject({ name: nombreProyecto.trim(), color: colorProyecto });
      setProyectoCreado(true);
      avanzar();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al crear el proyecto');
    } finally {
      setCreandoProyecto(false);
    }
  };

  const handleCopiarLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleEnviarInvitacion = async (e) => {
    e.preventDefault();
    if (!emailInvitado.trim()) return;
    setInvitando(true);
    try {
      const data = await generateInvite(emailInvitado.trim());
      setInviteUrl(data.inviteUrl);
      setInviteEnviado(true);
      avanzar();
    } catch (error) {
      console.error(error);
      if (error.response?.data?.inviteUrl) setInviteUrl(error.response.data.inviteUrl);
      if (error.response?.data?.noConfigurado) {
        // Todavía no configuró el email de notificaciones — eso es el paso
        // siguiente, no un error real acá. El link ya quedó generado igual.
        setInviteEnviado(true);
        avanzar();
      } else {
        alert(error.response?.data?.mensaje || 'Hubo un error al invitar');
      }
    } finally {
      setInvitando(false);
    }
  };

  const handleGuardarNotif = async (e) => {
    e.preventDefault();
    if (!notifEmail.trim() || !notifPassword.trim()) return;
    setGuardandoNotif(true);
    try {
      await updateOrg({ name: org?.name, notificationEmail: notifEmail.trim(), notificationEmailAppPassword: notifPassword.trim() });
      setNotifConfigurada(true);
      avanzar();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al guardar el email de notificaciones');
    } finally {
      setGuardandoNotif(false);
    }
  };

  const logros = [];
  if (proyectoCreado) logros.push('Creaste tu primer proyecto');
  if (inviteEnviado) logros.push('invitaste a tu equipo');
  if (notifConfigurada) logros.push('activaste los avisos automáticos');
  const resumenFinal = logros.length > 0
    ? `${logros.join(', ')}. Empecemos a trabajar.`
    : 'Podés terminar de configurar tu espacio cuando quieras, desde Configuración.';

  return (
    <div className="onboarding-shell">
      {paso < 5 && (
        <div className="onboarding-topbar">
          <button
            type="button"
            className="onboarding-back"
            onClick={retroceder}
            style={{ visibility: paso === 1 ? 'hidden' : 'visible' }}
            disabled={paso === 1}
          >
            <ArrowLeft size={14} /> Atrás
          </button>
          <div className="onboarding-steps">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`onboarding-step-dot ${paso === n ? 'is-active' : ''}`} />
            ))}
          </div>
          <button type="button" className="onboarding-skip" onClick={finalizarOnboarding} disabled={finalizando}>
            Omitir configuración
          </button>
        </div>
      )}

      <div className="onboarding-card">
        {paso === 1 && (
          <>
            <div className="onboarding-icon-cluster">
              <div className="onboarding-icon-side"><CheckCircle2 size={22} /></div>
              <div className="onboarding-icon-main"><img src={logo} alt="" /></div>
              <div className="onboarding-icon-side"><Rocket size={22} /></div>
            </div>
            <h1>¡Bienvenido a FocusOnWeb{user?.name ? `, ${user.name}` : ''}!</h1>
            <p className="onboarding-subtitle">
              Configuremos tu espacio de trabajo en un minuto. Podés cambiar todo esto después desde Configuración.
            </p>
            <div className="onboarding-actions">
              <button type="button" className="btn-primary" onClick={avanzar}>
                Empezar <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}

        {paso === 2 && (
          <>
            <h1>Creá tu primer proyecto</h1>
            <p className="onboarding-subtitle">Los proyectos organizan tus tareas — podés crear más después.</p>
            <form onSubmit={handleCrearProyecto} className="onboarding-form">
              <div className="form-group">
                <label>Nombre del proyecto</label>
                <input
                  type="text"
                  placeholder="Ej: Marketing Digital"
                  value={nombreProyecto}
                  onChange={(e) => setNombreProyecto(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Color del proyecto</label>
                <div className="color-picker">
                  {PROJECT_COLOR_KEYS.map((key) => (
                    <label key={key} className="color-swatch-label">
                      <input
                        type="radio"
                        name="color"
                        value={key}
                        checked={colorProyecto === key}
                        onChange={() => setColorProyecto(key)}
                      />
                      <span className="color-swatch" style={{ background: getProjectColor(key).dot }} />
                    </label>
                  ))}
                </div>
              </div>
              <div className="onboarding-actions">
                <button type="submit" className="btn-primary" disabled={creandoProyecto || !nombreProyecto.trim()}>
                  {creandoProyecto ? 'Creando…' : <>Crear y continuar <ArrowRight size={16} /></>}
                </button>
                <button type="button" className="btn-ghost" onClick={avanzar}>Omitir por ahora</button>
              </div>
            </form>
          </>
        )}

        {paso === 3 && (
          <>
            <h1>Sumá a tu primer empleado</h1>
            <p className="onboarding-subtitle">Le va a llegar un email para unirse a tu organización.</p>
            <form onSubmit={handleEnviarInvitacion} className="onboarding-form">
              <div className="form-group">
                <label>Email</label>
                <div className="input-with-icon">
                  <Mail size={17} />
                  <input
                    type="email"
                    placeholder="correo@empresa.com"
                    value={emailInvitado}
                    onChange={(e) => setEmailInvitado(e.target.value)}
                  />
                </div>
              </div>
              <div className="onboarding-divider"><span>o</span></div>
              <div className="form-group">
                <label>Compartir este link en su lugar</label>
                <div className="onboarding-link-row">
                  <input type="text" readOnly value={inviteUrl || 'Generando…'} />
                  <button type="button" className="icon-btn" onClick={handleCopiarLink} disabled={!inviteUrl} title="Copiar">
                    {copiado ? <Check size={16} className="icon-success" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="onboarding-actions">
                <button type="submit" className="btn-primary" disabled={invitando || !emailInvitado.trim()}>
                  {invitando ? 'Enviando…' : <>Enviar invitación <Send size={15} /></>}
                </button>
                <button type="button" className="btn-ghost" onClick={avanzar}>Omitir por ahora</button>
              </div>
            </form>
          </>
        )}

        {paso === 4 && (
          <>
            <h1>Activá los avisos por email</h1>
            <p className="onboarding-subtitle">
              Cuando le asignes una tarea a alguien, le va a llegar un email avisándole automáticamente. Podés
              configurarlo ahora o después desde Configuración.
            </p>
            <form onSubmit={handleGuardarNotif} className="onboarding-form">
              <div className="form-group">
                <label>Gmail de la empresa</label>
                <div className="input-with-icon">
                  <Mail size={17} />
                  <input
                    type="email"
                    placeholder="tu-empresa@gmail.com"
                    value={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Contraseña de aplicación</label>
                <div className="input-with-icon">
                  <Lock size={17} />
                  <input
                    type="password"
                    placeholder="abcd efgh ijkl mnop"
                    value={notifPassword}
                    onChange={(e) => setNotifPassword(e.target.value)}
                  />
                </div>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="onboarding-help-link"
                >
                  ¿Cómo genero una contraseña de aplicación?
                </a>
              </div>
              <div className="onboarding-actions">
                <button type="submit" className="btn-primary" disabled={guardandoNotif || !notifEmail.trim() || !notifPassword.trim()}>
                  {guardandoNotif ? 'Guardando…' : <>Guardar y continuar <ArrowRight size={16} /></>}
                </button>
                <button type="button" className="btn-ghost" onClick={avanzar}>Omitir por ahora</button>
              </div>
            </form>
          </>
        )}

        {paso === 5 && (
          <>
            <div className="onboarding-success-icon"><Check size={30} /></div>
            <h1>¡Todo listo!</h1>
            <p className="onboarding-subtitle">{resumenFinal}</p>
            <div className="onboarding-actions">
              <button type="button" className="btn-primary" onClick={finalizarOnboarding} disabled={finalizando}>
                {finalizando ? 'Un momento…' : <>Ir al Dashboard <ArrowRight size={16} /></>}
              </button>
            </div>
            <div className="onboarding-brand">
              <img src={logo} alt="" /> FOCUSONWEB
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
