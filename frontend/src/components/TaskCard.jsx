import { Clock, X, Check } from 'lucide-react';
import { getProjectColor } from '../utils/projectColors';
import './TaskCard.css';

const formatTime = (dueDate) => {
  if (!dueDate) return null;
  const fecha = new Date(dueDate);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

const TaskCard = ({ task, onDelete, onToggleComplete, canDelete }) => {
  const color = getProjectColor(task.project?.color);
  const hora = formatTime(task.dueDate);

  return (
    <div className={`task-card ${task.completed ? 'is-done' : ''}`}>
      <div className="task-card-tags">
        {task.project?.name && (
          <span className="pill" style={{ background: color.bg, color: color.text }}>
            {task.project.name.toUpperCase()}
          </span>
        )}
        {task.priority === 'high' && !task.completed && (
          <span className="pill pill-neutral">ALTA PRIORIDAD</span>
        )}
      </div>

      <h3 className={`task-card-title ${task.completed ? 'is-done' : ''}`}>{task.title}</h3>
      {task.description && <p className="task-card-desc">{task.description}</p>}

      <div className="task-card-footer">
        {hora ? (
          <span className="task-card-time">
            <Clock size={13} /> {hora}
          </span>
        ) : <span />}

        <div className="task-card-actions">
          {canDelete && (
            <button
              className="icon-btn icon-btn-danger"
              onClick={() => onDelete(task._id)}
              title="Eliminar tarea"
            >
              <X size={16} />
            </button>
          )}
          <button
            className="icon-btn icon-btn-success"
            onClick={() => onToggleComplete(task)}
            title={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
          >
            <Check size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
