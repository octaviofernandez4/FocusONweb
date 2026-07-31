import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, CalendarClock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProjectColor } from '../utils/projectColors';
import { PRIORIDAD_LABEL } from '../utils/taskAccess';
import RequestExtensionModal from './RequestExtensionModal';
import './TaskHistoryRow.css';

const formatFecha = (fecha) =>
  fecha ? new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '—';

const formatFechaHora = (fecha) =>
  fecha ? new Date(fecha).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const formatHora = (fecha) =>
  fecha ? new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—';

// input type="date" necesita YYYY-MM-DD en hora local, no en UTC.
const toDateInputValue = (fecha) => {
  const base = fecha ? new Date(fecha) : new Date();
  const local = new Date(base.getTime() - base.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const prioridadPillClass = (priority) =>
  (priority === 'high' ? 'pill-rose' : priority === 'low' ? 'pill-neutral' : 'pill-sky');

// Fila compartida por "Completadas" e "Incompletas" — misma información en las
// dos (asignado a, prioridad, estado, fecha de creación y de vencimiento) y
// clickeable para ver el detalle (solo la persona asignada o la cuenta empresa).
// Las acciones de extensión/reprogramación solo aplican a las incompletas.
const TaskHistoryRow = ({ task, onRequestExtension, onReschedule }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const esEmpresa = user?.accountType === 'empresa';
  const esAsignatario = String(task.assignedTo?._id || task.assignedTo) === String(user?._id);
  const puedeAbrir = esEmpresa || esAsignatario;
  const incompleta = !task.completed;

  const [modalAbierto, setModalAbierto] = useState(false);
  const [reprogramando, setReprogramando] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState(() => toDateInputValue(task.dueDate));

  const color = getProjectColor(task.project?.color);

  const abrirTarea = () => {
    if (puedeAbrir) navigate(`/app/tasks/${task._id}`, { state: { task } });
  };

  const confirmarReprogramacion = (e) => {
    e.stopPropagation();
    if (!nuevaFecha) return;
    onReschedule(task, new Date(`${nuevaFecha}T23:59:59`).toISOString());
    setReprogramando(false);
  };

  const enviarSolicitud = ({ motivo, fechaPropuesta }) => {
    onRequestExtension(task, { motivo, fechaPropuesta });
    setModalAbierto(false);
  };

  return (
    <div
      className={`task-history-row ${incompleta ? 'is-missed' : 'is-completed'} ${puedeAbrir ? 'is-clickable' : ''}`}
      onClick={abrirTarea}
    >
      <div className="task-history-main">
        <span className="task-history-icon">
          {incompleta ? <XCircle size={20} className="icon-danger" /> : <CheckCircle2 size={20} className="icon-success" />}
        </span>

        <div className="task-history-body">
          <div className="task-history-title-row">
            <p className="task-history-title">{task.title}</p>
            {task.project?.name && (
              <span className="pill" style={{ background: color.bg, color: color.text }}>
                {task.project.name.toUpperCase()}
              </span>
            )}
            <span className={`pill ${prioridadPillClass(task.priority)}`}>{PRIORIDAD_LABEL[task.priority] || 'MEDIA'}</span>
          </div>

          <div className="task-history-meta-row">
            <span>Asignado a: {task.assignedTo?.name ? `${task.assignedTo.name} ${task.assignedTo.lastname || ''}` : 'Sin asignar'}</span>
            <span>Creada: {formatFecha(task.createdAt)}</span>
            <span>{incompleta ? 'Venció' : 'Vencía'}: {formatFecha(task.dueDate)}</span>
          </div>

          {incompleta && task.extensionRequested && (
            <div className="task-history-extension-note">
              <AlertTriangle size={13} />
              Pidió extensión{task.extensionReason ? `: "${task.extensionReason}"` : ''}
              {task.extensionProposedDate && ` · Propone ${formatFechaHora(task.extensionProposedDate)}`}
            </div>
          )}
        </div>
      </div>

      <div className="task-history-side" onClick={(e) => e.stopPropagation()}>
        <span className={`pill ${incompleta ? 'pill-rose' : 'pill-emerald'}`}>{incompleta ? 'INCOMPLETA' : 'COMPLETADA'}</span>
        <span className={`task-history-time ${incompleta ? 'text-danger' : ''}`}>
          {incompleta ? `Perdida a las ${formatHora(task.dueDate)}` : `Completada a las ${formatHora(task.completedAt)}`}
        </span>

        {incompleta && (esEmpresa || esAsignatario) && (
          <div className="task-history-actions">
            {!esEmpresa && esAsignatario && (
              task.extensionRequested ? (
                <span className="task-history-request-sent"><Clock size={13} /> Extensión solicitada</span>
              ) : (
                <button className="btn-ghost task-history-action-btn" onClick={() => setModalAbierto(true)}>
                  <Clock size={14} /> Solicitar extensión
                </button>
              )
            )}

            {esEmpresa && (
              reprogramando ? (
                <div className="task-history-reschedule-form">
                  <input
                    type="date"
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button className="btn-primary task-history-action-btn" onClick={confirmarReprogramacion}>Guardar</button>
                  <button className="btn-ghost task-history-action-btn" onClick={(e) => { e.stopPropagation(); setReprogramando(false); }}>
                    Cancelar
                  </button>
                </div>
              ) : (
                <button className="btn-ghost task-history-action-btn" onClick={() => setReprogramando(true)}>
                  <CalendarClock size={14} /> Poner nueva fecha
                </button>
              )
            )}
          </div>
        )}
      </div>

      {incompleta && !esEmpresa && esAsignatario && (
        <RequestExtensionModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          task={task}
          onSubmit={enviarSolicitud}
        />
      )}
    </div>
  );
};

export default TaskHistoryRow;
