import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { getProjectColor } from '../utils/projectColors';
import { useAuth } from '../hooks/useAuth';
import { getTaskAccess, PRIORIDAD_LABEL } from '../utils/taskAccess';
import { isMissed } from '../utils/dateHelpers';
import './TaskCard.css';

const getInitials = (name, lastname) => `${name?.[0] || ''}${lastname?.[0] || ''}`.toUpperCase() || '?';

const formatFecha = (fecha) =>
  fecha ? new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : null;

// Tarjeta del tablero de Proyectos — solo muestra info y navega al detalle
// de la tarea (ahí viven los botones/modales de confirmar, marcar lista, etc.).
const TaskCard = ({ task, onMoveToProgress, onMoveToPending }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const color = getProjectColor(task.project?.color);
  const { estado, esEmpresa, esAsignatario, puedeTocarCheck } = getTaskAccess(task, user);
  const puedeAbrir = esEmpresa || esAsignatario;
  const vencida = isMissed(task);

  // Solo el empleado puede arrastrar su propia tarea: de "Por hacer" a "En
  // progreso" (indicador personal, sin aviso) o de "En progreso" a "Para
  // revisión" (ahí sí se avisa a la empresa) — ver Projects.jsx.
  const puedeArrastrar = !esEmpresa && (estado === 'pending' || estado === 'progress') && puedeTocarCheck;

  const abrirTarea = () => {
    if (puedeAbrir) navigate(`/app/tasks/${task._id}`, { state: { task } });
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', task._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // En touch no hay drag-and-drop nativo confiable, así que "Por hacer" y "En
  // progreso" suman este botón (solo visible en mobile vía CSS) como
  // alternativa a arrastrar.
  const mostrarBotonMover = puedeArrastrar && estado === 'pending' && onMoveToProgress;
  // Volver de "En progreso" a "Por hacer" — solo un indicador personal que se
  // deshace, nunca aplica si ya se mandó a revisión (eso ya no es "progress").
  const mostrarBotonVolver = puedeArrastrar && estado === 'progress' && onMoveToPending;

  const handleMoveClick = (e) => {
    e.stopPropagation();
    onMoveToProgress(task._id);
  };

  const handleMoveBackClick = (e) => {
    e.stopPropagation();
    onMoveToPending(task._id);
  };

  const fecha = estado === 'completed' ? formatFecha(task.completedAt) : formatFecha(task.dueDate);

  return (
    <div
      className={`task-card is-${estado} ${puedeAbrir ? 'is-clickable' : ''} ${puedeArrastrar ? 'is-draggable' : ''}`}
      onClick={abrirTarea}
      draggable={puedeArrastrar}
      onDragStart={puedeArrastrar ? handleDragStart : undefined}
    >
      <div className="task-card-tags">
        {task.project?.name && (
          <span className="pill" style={{ background: color.bg, color: color.text }}>
            {task.project.name.toUpperCase()}
          </span>
        )}
        {task.priority === 'high' && (
          <span className="pill pill-rose">🔺 {PRIORIDAD_LABEL[task.priority]}</span>
        )}
      </div>

      <h3 className={`task-card-title ${estado === 'completed' ? 'is-done' : ''}`}>{task.title}</h3>
      {task.description && <p className="task-card-desc">{task.description}</p>}

      <div className="task-card-footer">
        <span className="task-card-assignee">
          <span className="task-card-avatar">{getInitials(task.assignedTo?.name, task.assignedTo?.lastname)}</span>
          {task.assignedTo?.name ? `${task.assignedTo.name} ${task.assignedTo.lastname || ''}` : 'Sin asignar'}
        </span>

        {fecha && (
          <span className={`task-card-date ${vencida ? 'is-overdue' : ''}`}>
            {vencida ? `Vencida - ${fecha}` : fecha}
          </span>
        )}
      </div>

      {mostrarBotonMover && (
        <button type="button" className="task-card-move-btn" onClick={handleMoveClick}>
          Mover a en progreso <ArrowRight size={14} />
        </button>
      )}

      {mostrarBotonVolver && (
        <button type="button" className="task-card-move-btn is-back" onClick={handleMoveBackClick}>
          <ArrowLeft size={14} /> Volver a por hacer
        </button>
      )}
    </div>
  );
};

export default TaskCard;
