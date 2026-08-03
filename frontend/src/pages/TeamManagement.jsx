import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { UserPlus, Users, Building2, CheckCircle2, Link2, Copy, Check, ChevronLeft, ChevronRight, MoreHorizontal, Trash2, AlertTriangle, Mail, MessageCircle, Send, HelpCircle } from 'lucide-react';
import { listMembers, removeMember, generateInvite } from '../services/orgService';
import { getTasks, getTaskStats } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import Modal from '../components/Modal';
import './TeamManagement.css';

const PAGE_SIZE = 10;

const getInitials = (name, lastname) => `${name?.[0] || ''}${lastname?.[0] || ''}`.toUpperCase() || '?';

const rendimientoTono = (pct) => {
  if (pct === null) return 'is-empty';
  if (pct >= 90) return 'is-success';
  if (pct >= 70) return 'is-progress';
  return 'is-warning';
};

// "Gestión de Equipo" — reemplaza al recuadro "Miembros del equipo" que vivía
// en Configuración. Los datos de miembros/tareas/tasa de cumplimiento son
// reales; "Departamento" se deriva de los proyectos donde cada persona tiene
// alguna tarea (no existe un campo de departamento propio todavía — un
// miembro puede pertenecer a varios a la vez), y "Estado" siempre muestra
// "Activo" porque no hay seguimiento de presencia — son los próximos huecos
// a resolver a medida que se necesiten.
const TeamManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const esEmpresa = user?.accountType === 'empresa';
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroDepartamento, setFiltroDepartamento] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pagina, setPagina] = useState(1);
  const [modalInviteAbierto, setModalInviteAbierto] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [emailEnviadoOk, setEmailEnviadoOk] = useState(null);
  const [whatsappNumero, setWhatsappNumero] = useState('');
  const [modalAyudaEmailAbierto, setModalAyudaEmailAbierto] = useState(false);
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);
  const [miembroAEliminar, setMiembroAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const menuRef = useRef(null);

  const cargarDatos = useCallback(async () => {
    try {
      const [miembros, tareas, estadisticas] = await Promise.all([listMembers(), getTasks(), getTaskStats()]);
      setMembers(miembros);
      setTasks(tareas);
      setStats(estadisticas);
    } catch (error) {
      console.error('Error al cargar la gestión de equipo:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (!menuAbiertoId) return;
    const cerrarSiEsAfuera = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbiertoId(null);
      }
    };
    document.addEventListener('mousedown', cerrarSiEsAfuera);
    return () => document.removeEventListener('mousedown', cerrarSiEsAfuera);
  }, [menuAbiertoId]);

  // Departamentos "activos" = proyectos con al menos una tarea sin completar.
  const departamentosActivos = useMemo(() => {
    const idsActivos = new Set(
      tasks.filter((t) => !t.completed && t.project?._id).map((t) => t.project._id)
    );
    return idsActivos.size;
  }, [tasks]);

  const filas = useMemo(() => {
    return members.map((m) => {
      const tareasDelMiembro = tasks.filter((t) => String(t.assignedTo?._id || t.assignedTo) === String(m.id));
      const total = tareasDelMiembro.length;
      const completadas = tareasDelMiembro.filter((t) => t.completed).length;
      const rendimiento = total === 0 ? null : Math.round((completadas / total) * 100);

      // Un miembro pertenece a TODOS los departamentos (proyectos) donde tiene alguna tarea,
      // no solo al que más tiene.
      const departamentos = [...new Set(
        tareasDelMiembro.filter((t) => t.project?.name).map((t) => t.project.name)
      )].sort();

      return {
        ...m,
        departamentos,
        totalTareas: total,
        rendimiento,
        estado: 'Activo'
      };
    });
  }, [members, tasks]);

  const departamentosDisponibles = useMemo(
    () => [...new Set(filas.flatMap((f) => f.departamentos))].sort(),
    [filas]
  );

  const filtradas = filas.filter((f) => {
    if (filtroDepartamento && !f.departamentos.includes(filtroDepartamento)) return false;
    if (filtroEstado && f.estado !== filtroEstado) return false;
    return true;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);

  const hayFiltrosActivos = Boolean(filtroDepartamento || filtroEstado);

  const limpiarFiltros = () => {
    setFiltroDepartamento('');
    setFiltroEstado('');
    setPagina(1);
  };

  const cambiarFiltro = (setter) => (valor) => {
    setter(valor);
    setPagina(1);
  };

  const abrirInvitar = async () => {
    setModalInviteAbierto(true);
    setCopied(false);
    setInviteEmailInput('');
    setEmailEnviadoOk(null);
    setWhatsappNumero('');
    try {
      const data = await generateInvite();
      setInviteUrl(data.inviteUrl);
    } catch (error) {
      console.error(error);
      alert('Hubo un error al generar el link de invitación');
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnviarPorEmail = async (e) => {
    e.preventDefault();
    if (!inviteEmailInput.trim()) return;
    setEnviandoEmail(true);
    setEmailEnviadoOk(null);
    try {
      const data = await generateInvite(inviteEmailInput.trim());
      setInviteUrl(data.inviteUrl);
      setEmailEnviadoOk(true);
      setInviteEmailInput('');
    } catch (error) {
      console.error(error);
      // Aunque falle el envío, el backend ya generó un link válido — lo mostramos igual.
      if (error.response?.data?.inviteUrl) setInviteUrl(error.response.data.inviteUrl);
      setEmailEnviadoOk(false);
      if (error.response?.data?.noConfigurado) {
        setModalAyudaEmailAbierto(true);
      } else {
        alert(error.response?.data?.mensaje || 'Hubo un error al enviar la invitación por email');
      }
    } finally {
      setEnviandoEmail(false);
    }
  };

  const handleEnviarPorWhatsapp = () => {
    const numero = whatsappNumero.replace(/\D/g, '');
    if (!numero || !inviteUrl) return;
    // WhatsApp identifica los celulares argentinos con un "9" pegado después
    // del código de país (54), antes del código de área — por eso NO alcanza
    // con "54" + el número tal cual se marca localmente.
    const mensaje = `Te invito a sumarte a nuestro equipo en FocusOnWeb: ${inviteUrl}`;
    window.open(`https://wa.me/549${numero}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer');
  };

  const confirmarEliminar = async () => {
    if (!miembroAEliminar) return;
    setEliminando(true);
    try {
      await removeMember(miembroAEliminar.id);
      setMiembroAEliminar(null);
      // Eliminarlo también borra sus tareas del lado del servidor — recargamos
      // todo (miembros, tareas y tasa de cumplimiento) para que quede consistente.
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al eliminar al miembro');
    } finally {
      setEliminando(false);
    }
  };

  // Solo tiene sentido para la cuenta empresa (es quien administra el equipo).
  if (!esEmpresa) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="team-page">
      <div className="team-header">
        <div>
          <h1>Gestión de Equipo</h1>
          <p className="page-subtitle">Visualiza y administra todos los miembros de tu organización.</p>
        </div>
        <button className="btn-primary team-add-btn" onClick={abrirInvitar}>
          <UserPlus size={16} /> Añadir Miembro
        </button>
      </div>

      <div className="team-stats">
        <div className="team-stat-card">
          <div className="team-stat-top">
            <span className="team-stat-label">TOTAL EMPLEADOS</span>
            <span className="team-stat-icon"><Users size={16} /></span>
          </div>
          <p className="team-stat-value">{members.length}</p>
          <span className="team-stat-hint">Miembros de tu organización.</span>
        </div>

        <div className="team-stat-card">
          <div className="team-stat-top">
            <span className="team-stat-label">DEPARTAMENTOS ACTIVOS</span>
            <span className="team-stat-icon"><Building2 size={16} /></span>
          </div>
          <p className="team-stat-value">{departamentosActivos}</p>
          <span className="team-stat-hint">Proyectos con tareas en curso.</span>
        </div>

        <div className="team-stat-card is-highlighted">
          <div className="team-stat-top">
            <span className="team-stat-label">TASA DE CUMPLIMIENTO</span>
            <span className="team-stat-icon"><CheckCircle2 size={16} /></span>
          </div>
          <p className="team-stat-value">{stats ? `${stats.completionRate}%` : '—'}</p>
          <div className="team-stat-bar">
            <span className="team-stat-bar-fill" style={{ width: `${stats?.completionRate || 0}%` }} />
          </div>
          <span className="team-stat-hint">Promedio general del equipo.</span>
        </div>
      </div>

      <div className="team-toolbar">
        <select value={filtroDepartamento} onChange={(e) => cambiarFiltro(setFiltroDepartamento)(e.target.value)}>
          <option value="">Departamento</option>
          {departamentosDisponibles.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select value={filtroEstado} onChange={(e) => cambiarFiltro(setFiltroEstado)(e.target.value)}>
          <option value="">Estado</option>
          <option value="Activo">Activo</option>
        </select>

        {hayFiltrosActivos && (
          <button className="team-clear-filters" onClick={limpiarFiltros}>
            Limpiar Filtros
          </button>
        )}
      </div>

      <div className="team-table-wrap card-panel">
        {isLoading ? (
          <p className="empty-state">Cargando equipo…</p>
        ) : filtradas.length === 0 ? (
          <p className="empty-state">No hay miembros que coincidan con el filtro.</p>
        ) : (
          <>
            <table className="team-table">
              <thead>
                <tr>
                  <th>Miembro del Equipo</th>
                  <th>Departamento</th>
                  <th>Tareas</th>
                  <th>Rendimiento</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((m) => (
                  <tr key={m.id}>
                    <td data-label="Miembro">
                      <div className="team-member-cell">
                        {m.avatarUrl ? (
                          <img src={m.avatarUrl} alt={`Foto de ${m.name}`} className="team-member-avatar" />
                        ) : (
                          <div className="team-member-avatar team-member-avatar-fallback">{getInitials(m.name, m.lastname)}</div>
                        )}
                        <div>
                          <p className="team-member-name">{m.name} {m.lastname}</p>
                          <span className="team-member-email">{m.email}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Departamento">{m.departamentos.length ? m.departamentos.join(', ') : '—'}</td>
                    <td data-label="Tareas">{m.totalTareas}</td>
                    <td data-label="Rendimiento">
                      <div className="team-rendimiento">
                        <div className="team-rendimiento-track">
                          <span className={`team-rendimiento-fill ${rendimientoTono(m.rendimiento)}`} style={{ width: `${m.rendimiento ?? 0}%` }} />
                        </div>
                        <span className="team-rendimiento-value">{m.rendimiento === null ? 'N/A' : `${m.rendimiento}%`}</span>
                      </div>
                    </td>
                    <td data-label="Estado">
                      <span className="pill pill-emerald team-estado-pill">● {m.estado}</span>
                    </td>
                    <td data-label="Acciones">
                      <div className="team-actions-cell" ref={menuAbiertoId === m.id ? menuRef : null}>
                        <button
                          className="icon-btn"
                          title="Acciones"
                          onClick={() => setMenuAbiertoId((id) => (id === m.id ? null : m.id))}
                        >
                          <MoreHorizontal size={15} />
                        </button>
                        {menuAbiertoId === m.id && (
                          <div className="team-actions-menu">
                            <button
                              type="button"
                              className="team-actions-menu-item is-danger"
                              onClick={() => {
                                setMenuAbiertoId(null);
                                setMiembroAEliminar(m);
                              }}
                            >
                              <Trash2 size={14} /> Eliminar miembro
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="team-pagination">
              <span>Mostrando {(paginaActual - 1) * PAGE_SIZE + 1}–{Math.min(paginaActual * PAGE_SIZE, filtradas.length)} de {filtradas.length} empleados</span>
              <div className="team-pagination-actions">
                <button className="icon-btn" disabled={paginaActual === 1} onClick={() => setPagina((p) => p - 1)}>
                  <ChevronLeft size={15} />
                </button>
                <button className="icon-btn" disabled={paginaActual === totalPaginas} onClick={() => setPagina((p) => p + 1)}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal isOpen={modalInviteAbierto} onClose={() => setModalInviteAbierto(false)} title="Invitar a la organización">
        <p className="team-invite-subtitle">
          Sumá nuevos talentos a tu equipo y empezá a asignarles tareas.
        </p>

        <form onSubmit={handleEnviarPorEmail} className="team-invite-block">
          <span className="team-invite-label">
            <Mail size={13} /> POR EMAIL
            <button
              type="button"
              className="team-invite-help-btn"
              title="¿Cómo funciona?"
              onClick={() => setModalAyudaEmailAbierto(true)}
            >
              <HelpCircle size={13} />
            </button>
          </span>
          <div className="team-invite-input-row">
            <input
              type="email"
              placeholder="correo@empresa.com"
              value={inviteEmailInput}
              onChange={(e) => setInviteEmailInput(e.target.value)}
            />
            <button type="submit" className="btn-primary team-invite-send" disabled={enviandoEmail || !inviteEmailInput.trim()}>
              {enviandoEmail ? 'Enviando…' : <>Enviar <Send size={14} /></>}
            </button>
          </div>
          {emailEnviadoOk === true && <span className="team-invite-feedback is-ok">Invitación enviada ✓</span>}
        </form>

        <div className="team-invite-divider"><span>o</span></div>

        <div className="team-invite-block">
          <span className="team-invite-label"><MessageCircle size={13} /> POR WHATSAPP</span>
          <div className="team-invite-input-row">
            <span className="team-invite-phone-prefix">+54</span>
            <input
              type="tel"
              placeholder="11 2345 6789"
              value={whatsappNumero}
              onChange={(e) => setWhatsappNumero(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary team-invite-send"
              onClick={handleEnviarPorWhatsapp}
              disabled={!whatsappNumero.trim() || !inviteUrl}
            >
              Enviar <Send size={14} />
            </button>
          </div>
          <span className="team-invite-feedback">Código de área + número, sin el 0 ni el 15 (ej: 11 2345 6789).</span>
        </div>

        <div className="team-invite-block">
          <span className="team-invite-label"><Link2 size={13} /> ENLACE DE INVITACIÓN</span>
          <div className="team-invite-row">
            <input type="text" readOnly value={inviteUrl || 'Generando…'} />
            <button type="button" className="icon-btn" onClick={handleCopy} disabled={!inviteUrl} title="Copiar">
              {copied ? <Check size={16} className="icon-success" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalAyudaEmailAbierto} onClose={() => setModalAyudaEmailAbierto(false)} title="Configurá el email de tu empresa">
        <div className="team-help-email">
          <div className="team-help-email-icon"><Mail size={24} /></div>
          <p>
            Para invitar por email hace falta conectar el Gmail de tu empresa — es el mismo que después manda los
            avisos de "tarea asignada".
          </p>
          <ol className="team-help-email-steps">
            <li>Activá la verificación en 2 pasos en tu cuenta de Google, si todavía no la tenés.</li>
            <li>
              Generá una <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">contraseña de aplicación</a> —
              no es tu contraseña normal de Gmail.
            </li>
            <li>Cargá ese Gmail y la contraseña en Configuración, en "Email para notificaciones automáticas", y guardá.</li>
          </ol>
          <div className="team-help-email-actions">
            <button type="button" className="btn-ghost" onClick={() => setModalAyudaEmailAbierto(false)}>Entendido</button>
            <button type="button" className="btn-primary" onClick={() => navigate('/app/settings')}>Ir a Configuración</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!miembroAEliminar} onClose={() => setMiembroAEliminar(null)} title="Eliminar miembro">
        <div className="confirm-danger">
          <div className="confirm-danger-icon"><AlertTriangle size={24} /></div>
          <h3>¿Eliminar a este miembro?</h3>
          <p>
            ¿Estás seguro de que querés eliminar a <strong>{miembroAEliminar?.name} {miembroAEliminar?.lastname}</strong> de
            la organización? Esta acción no se puede deshacer.
          </p>
          {miembroAEliminar?.totalTareas > 0 && (
            <p>
              Tiene <strong>{miembroAEliminar.totalTareas}</strong> tarea{miembroAEliminar.totalTareas === 1 ? '' : 's'} asignada
              {miembroAEliminar.totalTareas === 1 ? '' : 's'} — se {miembroAEliminar.totalTareas === 1 ? 'eliminará' : 'eliminarán'} también.
            </p>
          )}
          <div className="confirm-danger-actions">
            <button className="btn-ghost" onClick={() => setMiembroAEliminar(null)} disabled={eliminando}>Cancelar</button>
            <button className="btn-danger" onClick={confirmarEliminar} disabled={eliminando}>
              {eliminando ? 'Eliminando…' : 'Eliminar miembro'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeamManagement;
