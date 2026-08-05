import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Paperclip, FileText, Clock, HelpCircle, CheckCircle2, User, CalendarDays, FolderOpen, AlertTriangle, RotateCcw, Hourglass } from 'lucide-react';
import { getTasks, updateTask } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';
import { getTaskAccess, ESTADO_LABEL, PRIORIDAD_LABEL } from '../utils/taskAccess';
import { formatTamanio } from '../utils/fileSize';
import ReopenTaskModal from '../components/ReopenTaskModal';
import ApproveTaskModal from '../components/ApproveTaskModal';
import RequestClarificationModal from '../components/RequestClarificationModal';
import './TaskDetail.css';

const formatFechaCorta = (fecha) => {
  if (!fecha) return 'Sin fecha';
  return new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
};

// Si el texto tiene fragmentos entre backticks, los renderiza como <code> en
// vez de mostrar los backticks literales.
const renderConCodigo = (texto) =>
  texto.split(/(`[^`]+`)/g).map((parte, i) =>
    parte.startsWith('`') && parte.endsWith('`') ? (
      <code key={i} className="taskdetail-inline-code">{parte.slice(1, -1)}</code>
    ) : (
      <span key={i}>{parte}</span>
    )
  );

// Líneas que arrancan con "-" o "•" se agrupan en una lista con viñetas; el
// resto se muestra como párrafos sueltos — así una descripción escrita con
// ese formato se ve prolija, sin inventar nada que el usuario no haya tipeado.
const renderDescripcion = (texto) => {
  const bloques = [];
  let bullets = [];

  const cerrarBullets = () => {
    if (bullets.length > 0) {
      bloques.push({ tipo: 'ul', items: bullets });
      bullets = [];
    }
  };

  texto.split('\n').forEach((linea, i) => {
    const esBullet = /^[-•]\s+/.test(linea.trim());
    if (esBullet) {
      bullets.push(linea.trim().replace(/^[-•]\s+/, ''));
    } else {
      cerrarBullets();
      if (linea.trim()) bloques.push({ tipo: 'p', texto: linea, key: i });
    }
  });
  cerrarBullets();

  return bloques;
};

const TaskDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState(location.state?.task || null);
  usePageTitle(task?.title || 'Detalle de Tarea');
  const [isLoading, setIsLoading] = useState(!location.state?.task);
  const [modalReabrirAbierto, setModalReabrirAbierto] = useState(false);
  const [modalAprobarAbierto, setModalAprobarAbierto] = useState(false);
  const [modalAclaracionAbierto, setModalAclaracionAbierto] = useState(false);
  const [respuestaAclaracion, setRespuestaAclaracion] = useState('');
  const [respondiendoAclaracion, setRespondiendoAclaracion] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await getTasks();
      setTask(data.find((t) => t._id === id) || null);
    } catch (error) {
      console.error('Error al cargar la tarea:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Ojo: React Router no remonta el componente al navegar de una tarea a otra
  // (misma ruta, distinto :id) — hay que resincronizar "a mano" cada vez que
  // cambia el id, si no la tarea vieja queda pegada en el estado.
  useEffect(() => {
    if (location.state?.task && location.state.task._id === id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTask(location.state.task);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      cargar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) return <p className="empty-state">Cargando tarea…</p>;
  if (!task) return <p className="empty-state">No se encontró esa tarea.</p>;

  const { estado, esEmpresa, esAsignatario, puedeTocarCheck, esReapertura, tituloBoton } = getTaskAccess(task, user);

  // El botón solo lo ve la empresa (ver más abajo), así que acá solo hace
  // falta decidir cuál de los dos modales abrir: reabrir o aprobar.
  const handleAccion = () => {
    if (esReapertura) {
      setModalReabrirAbierto(true);
    } else {
      setModalAprobarAbierto(true);
    }
  };

  const handleReopenSubmit = async ({ nuevaFecha }) => {
    try {
      const { tarea } = await updateTask(task._id, {
        ...task,
        completed: false,
        pendingReview: false,
        dueDate: nuevaFecha,
      });
      setTask(tarea);
      setModalReabrirAbierto(false);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al reabrir la tarea');
    }
  };

  const handleApproveSubmit = async ({ qualityLevel, comentario }) => {
    try {
      const { tarea } = await updateTask(task._id, {
        ...task,
        completed: true,
        qualityLevel,
        completionComment: comentario,
      });
      setTask(tarea);
      setModalAprobarAbierto(false);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al aprobar la tarea');
    }
  };

  const handleSolicitarAclaracion = async ({ pregunta }) => {
    try {
      const { tarea } = await updateTask(task._id, {
        ...task,
        clarificationRequested: true,
        clarificationQuestion: pregunta,
      });
      setTask(tarea);
      setModalAclaracionAbierto(false);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al solicitar la aclaración');
    }
  };

  const handleResponderAclaracion = async (e) => {
    e.preventDefault();
    if (!respuestaAclaracion.trim()) return;
    setRespondiendoAclaracion(true);
    try {
      const { tarea } = await updateTask(task._id, {
        ...task,
        clarificationAnswer: respuestaAclaracion.trim(),
      });
      setTask(tarea);
      setRespuestaAclaracion('');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al responder la aclaración');
    } finally {
      setRespondiendoAclaracion(false);
    }
  };

  return (
    <div className="taskdetail-page">
      <div className="taskdetail-breadcrumb">
        <button className="icon-btn" title="Volver" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} />
        </button>
        <span>Proyectos</span>
        {task.project?.name && (
          <>
            <span>/</span>
            <span>{task.project.name}</span>
          </>
        )}
        <span>/</span>
        <span>Tarea-{task._id.slice(-4).toUpperCase()}</span>
      </div>

      <div className="taskdetail-card card-panel">
        <div className="taskdetail-badges">
          <span className={`taskdetail-badge is-priority-${task.priority || 'medium'}`}>
            {task.priority === 'high' && <AlertTriangle size={12} />}
            PRIORIDAD: {PRIORIDAD_LABEL[task.priority] || 'MEDIA'}
          </span>
          <span className={`taskdetail-badge is-estado-${estado}`}>
            {ESTADO_LABEL[estado]}
          </span>
        </div>

        <h1>{task.title}</h1>
        <p className="taskdetail-idline">
          ID: TSK-{task._id.slice(-4).toUpperCase()} • Creado el {formatFechaCorta(task.createdAt)}
        </p>

        <div className="taskdetail-meta-grid">
          <div className="taskdetail-meta-box">
            <span className="taskdetail-meta-label"><User size={13} /> Asignado a</span>
            <p>{task.assignedTo?.name ? `${task.assignedTo.name} ${task.assignedTo.lastname || ''}` : 'Sin asignar'}</p>
          </div>
          <div className="taskdetail-meta-box">
            <span className="taskdetail-meta-label"><CalendarDays size={13} /> Fecha límite</span>
            <p>{formatFechaCorta(task.dueDate)}</p>
          </div>
          <div className="taskdetail-meta-box">
            <span className="taskdetail-meta-label"><FolderOpen size={13} /> Proyecto</span>
            <p>{task.project?.name || 'Sin proyecto'}</p>
          </div>
          <div className="taskdetail-meta-box">
            <span className="taskdetail-meta-label"><Clock size={13} /> Tiempo est.</span>
            <p>{task.estimatedHours ? `${task.estimatedHours} hrs` : 'Sin estimar'}</p>
          </div>
        </div>

        <div className="taskdetail-description-block">
          <h2>Descripción</h2>
          {task.description ? (
            renderDescripcion(task.description).map((bloque, i) =>
              bloque.tipo === 'ul' ? (
                <ul key={`ul-${i}`} className="taskdetail-description-list">
                  {bloque.items.map((item, j) => (
                    <li key={j}>{renderConCodigo(item)}</li>
                  ))}
                </ul>
              ) : (
                <p key={bloque.key} className="taskdetail-description">{renderConCodigo(bloque.texto)}</p>
              )
            )
          ) : (
            <p className="taskdetail-description taskdetail-no-desc">Esta tarea no tiene descripción.</p>
          )}
        </div>

        {task.attachments?.length > 0 && (
          <div className="taskdetail-attachments">
            <div className="taskdetail-attachments-header">
              <h2>Archivos adjuntos</h2>
            </div>
            <div className="taskdetail-attachments-grid">
              {task.attachments.map((file) => (
                <a
                  key={file.url || file.name}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="taskdetail-attachment"
                >
                  <FileText size={18} />
                  <div>
                    <p>{file.name}</p>
                    <span>{formatTamanio(file.size)}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {task.clarificationRequested && (
          <div className="taskdetail-clarification is-pending">
            <div className="taskdetail-clarification-header">
              <HelpCircle size={16} /> <span>Aclaración pedida</span>
            </div>
            <p className="taskdetail-clarification-question">{task.clarificationQuestion}</p>
            {esAsignatario ? (
              <form onSubmit={handleResponderAclaracion} className="taskdetail-clarification-reply">
                <textarea
                  rows={3}
                  placeholder="Escribí tu respuesta…"
                  value={respuestaAclaracion}
                  onChange={(e) => setRespuestaAclaracion(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary" disabled={respondiendoAclaracion || !respuestaAclaracion.trim()}>
                  {respondiendoAclaracion ? 'Enviando…' : 'Enviar respuesta'}
                </button>
              </form>
            ) : (
              <span className="taskdetail-clarification-waiting">
                Esperando respuesta de {task.assignedTo?.name || 'la persona asignada'}.
              </span>
            )}
          </div>
        )}

        {!task.clarificationRequested && task.clarificationAnswer && (
          <div className="taskdetail-clarification is-answered">
            <div className="taskdetail-clarification-header">
              <CheckCircle2 size={16} /> <span>Aclaración respondida</span>
            </div>
            <p className="taskdetail-clarification-question">{task.clarificationQuestion}</p>
            <p className="taskdetail-clarification-answer">{task.clarificationAnswer}</p>
          </div>
        )}

        {esEmpresa && (
          <div className="taskdetail-footer-actions">
            {task.clarificationRequested ? (
              <button className="btn-ghost" disabled title="Esperando respuesta">
                <Hourglass size={15} /> Aclaración pendiente
              </button>
            ) : (
              <button className="btn-ghost" onClick={() => setModalAclaracionAbierto(true)}>
                <Paperclip size={15} /> Solicitar aclaración
              </button>
            )}
            {/* "Marcar como lista"/"Deshacer" solo vive en Mis tareas (con su confirmación). */}
            {puedeTocarCheck && (
              estado === 'review' ? (
                // En revisión hay dos decisiones reales y separadas: mandarla de
                // vuelta (reabrir, mismo modal que pide motivo + fecha nueva) o aprobarla.
                // Aprobar queda bloqueado mientras haya una aclaración sin responder:
                // no tiene sentido confirmar el trabajo antes de tener esa respuesta.
                <>
                  <button className="btn-ghost" onClick={() => setModalReabrirAbierto(true)}>
                    <RotateCcw size={15} /> Reabrir
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => setModalAprobarAbierto(true)}
                    disabled={task.clarificationRequested}
                    title={task.clarificationRequested ? 'Esperá la respuesta de la aclaración antes de aprobar' : undefined}
                  >
                    <CheckCircle2 size={15} /> Aprobar
                  </button>
                </>
              ) : (
                <button
                  className="btn-primary"
                  onClick={handleAccion}
                  disabled={!esReapertura && task.clarificationRequested}
                >
                  {tituloBoton}
                </button>
              )
            )}
          </div>
        )}
      </div>

      <ReopenTaskModal
        isOpen={modalReabrirAbierto}
        onClose={() => setModalReabrirAbierto(false)}
        task={task}
        onSubmit={handleReopenSubmit}
      />

      <ApproveTaskModal
        isOpen={modalAprobarAbierto}
        onClose={() => setModalAprobarAbierto(false)}
        task={task}
        onSubmit={handleApproveSubmit}
      />

      <RequestClarificationModal
        isOpen={modalAclaracionAbierto}
        onClose={() => setModalAclaracionAbierto(false)}
        task={task}
        onSubmit={handleSolicitarAclaracion}
      />
    </div>
  );
};

export default TaskDetail;
