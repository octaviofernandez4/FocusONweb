import { CheckCircle2, XCircle } from 'lucide-react';
import { getProjectColor } from '../utils/projectColors';
import './CompletedTaskRow.css';

const formatHora = (fecha) =>
  fecha
    ? new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : null;

const CompletedTaskRow = ({ task, isMissed }) => {
  const color = getProjectColor(task.project?.color);
  const horaCompletada = formatHora(task.completedAt);
  const horaVencimiento = formatHora(task.dueDate);

  return (
    <div className={`completed-row ${isMissed ? 'is-missed' : ''}`}>
      <span className="completed-row-icon">
        {isMissed ? <XCircle size={20} className="icon-danger" /> : <CheckCircle2 size={20} className="icon-success" />}
      </span>

      <div className="completed-row-body">
        <p className="completed-row-title">{task.title}</p>
        {task.project?.name && (
          <span className="pill" style={{ background: color.bg, color: color.text }}>
            {task.project.name.toUpperCase()}
          </span>
        )}
      </div>

      <span className={`completed-row-meta ${isMissed ? 'text-danger' : ''}`}>
        {isMissed ? `Perdida a las ${horaVencimiento || '—'}` : `Completada a las ${horaCompletada || '—'}`}
      </span>
    </div>
  );
};

export default CompletedTaskRow;
