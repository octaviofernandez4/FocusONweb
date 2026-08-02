import { CalendarDays, Check } from 'lucide-react';
import { getEstado, ESTADO_LABEL } from '../utils/taskAccess';
import { getProjectColor } from '../utils/projectColors';
import './TaskListItem.css';

const PRIORIDAD_INFO = {
  high: { label: 'Alta Prioridad', pill: 'pill-rose' },
  medium: { label: 'Media Prioridad', pill: 'pill-amber' },
  low: { label: 'Baja Prioridad', pill: 'pill-neutral' },
};

const ESTADO_PILL = { pending: 'pill-neutral', progress: 'pill-sky', review: 'pill-amber', completed: 'pill-emerald' };

const formatFechaHora = (dueDate) =>
  dueDate
    ? new Date(dueDate).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Sin fecha';

// Fila de tarea reutilizada por "Mis tareas de hoy" (Dashboard de empleado) y
// por "Mis tareas" — mismo look: checkbox circular + calendario/fecha/proyecto
// a la izquierda, pill de prioridad + pill de estado a la derecha.
const TaskListItem = ({ task, onOpen, onCheckboxClick }) => {
  const estado = getEstado(task);
  const prioridad = PRIORIDAD_INFO[task.priority] || PRIORIDAD_INFO.medium;
  const color = getProjectColor(task.project?.color);

  return (
    <li className="task-list-item is-clickable" onClick={() => onOpen(task)}>
      <button
        className={`task-list-checkbox ${task.pendingReview ? 'is-checked' : ''}`}
        title={task.pendingReview ? 'Deshacer' : 'Marcar como lista'}
        onClick={(e) => { e.stopPropagation(); onCheckboxClick(task); }}
      >
        {task.pendingReview && <Check size={13} />}
      </button>
      <div className="task-list-item-body">
        <p className="task-list-item-title">{task.title}</p>
        <span className="task-list-item-meta">
          <CalendarDays size={13} /> {formatFechaHora(task.dueDate)}
          {task.project?.name && (
            <> · <span className="task-list-item-project" style={{ color: color.text }}>{task.project.name}</span></>
          )}
        </span>
      </div>
      <div className="task-list-item-pills">
        <span className={`pill ${prioridad.pill}`}>{prioridad.label}</span>
        <span className={`pill ${ESTADO_PILL[estado]}`}>{ESTADO_LABEL[estado]}</span>
      </div>
    </li>
  );
};

export default TaskListItem;
