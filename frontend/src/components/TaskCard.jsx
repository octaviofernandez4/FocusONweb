import { Clock, X, Check } from 'lucide-react';
import { getProjectColor } from '../utils/projectColors';
import { useAuth } from '../hooks/useAuth';
import { getTaskAccess } from '../utils/taskAccess';
import './TaskCard.css';

const formatTime = (dueDate) => {
  if (!dueDate) return null;
  const fecha = new Date(dueDate);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

const TaskCard = ({ task, onDelete, onToggleComplete }) => {
  const { user } = useAuth();
  const color = getProjectColor(task.project?.color);
  const hora = formatTime(task.dueDate);
  const { estado, puedeTocarCheck, puedeBorrar, tituloBoton } = getTaskAccess(task, user);

  return (
    <div className={`task-card is-${estado}`}>
      <div className="task-card-tags">
        {task.project?.name && (
          <span className="pill" style={{ background: color.bg, color: color.text }}>
            {task.project.name.toUpperCase()}
          </span>
        )}
        {task.priority === 'high' && estado === 'pending' && (
          <span className="pill pill-neutral">ALTA PRIORIDAD</span>
        )}
        {estado === 'review' && (
          <span className="pill pill-amber">PENDIENTE DE CONFIRMACIÓN</span>
        )}
      </div>

      <h3 className={`task-card-title ${estado === 'completed' ? 'is-done' : ''}`}>{task.title}</h3>
      {task.description && <p className="task-card-desc">{task.description}</p>}
      {task.assignedTo?.name && (
        <p className="task-card-assignee">Asignada a {task.assignedTo.name} {task.assignedTo.lastname || ''}</p>
      )}

      <div className="task-card-footer">
        {hora ? (
          <span className="task-card-time">
            <Clock size={13} /> {hora}
          </span>
        ) : <span />}

        <div className="task-card-actions">
          {puedeBorrar && (
            <button
              className="icon-btn icon-btn-danger"
              onClick={() => onDelete(task._id)}
              title="Eliminar tarea"
            >
              <X size={16} />
            </button>
          )}
          {puedeTocarCheck && (
            <button
              className="icon-btn icon-btn-success"
              onClick={() => onToggleComplete(task)}
              title={tituloBoton}
            >
              <Check size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
