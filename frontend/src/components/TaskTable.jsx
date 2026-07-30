import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getTaskAccess, ESTADO_LABEL, PRIORIDAD_LABEL } from '../utils/taskAccess';
import { getProjectColor } from '../utils/projectColors';
import './TaskTable.css';

const formatFecha = (dueDate) => {
  if (!dueDate) return 'Sin fecha';
  return new Date(dueDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
};

// Tabla de tareas reutilizada por "Tareas del equipo" y el Dashboard de empresa.
// Las acciones de cada fila respetan las mismas reglas que TaskCard (ver utils/taskAccess).
const TaskTable = ({ tasks, onToggle, onDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const abrirTarea = (task) => navigate(`/app/tasks/${task._id}`, { state: { task } });

  return (
    <div className="task-table-wrap card-panel">
      <table className="task-table">
        <thead>
          <tr>
            <th>Tarea</th>
            <th>Asignado a</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Fecha límite</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const { estado, puedeTocarCheck, puedeBorrar, tituloBoton } = getTaskAccess(task, user);
            const color = getProjectColor(task.project?.color);
            return (
              <tr key={task._id} className="is-clickable" onClick={() => abrirTarea(task)}>
                <td>
                  <p className="task-table-title">{task.title}</p>
                  {task.project?.name && (
                    <span className="pill" style={{ background: color.bg, color: color.text }}>{task.project.name.toUpperCase()}</span>
                  )}
                </td>
                <td>{task.assignedTo?.name ? `${task.assignedTo.name} ${task.assignedTo.lastname || ''}` : 'Sin asignar'}</td>
                <td>
                  <span className={`pill ${task.priority === 'high' ? 'pill-rose' : task.priority === 'low' ? 'pill-neutral' : 'pill-sky'}`}>
                    {PRIORIDAD_LABEL[task.priority] || 'MEDIA'}
                  </span>
                </td>
                <td>
                  <span className={`pill ${estado === 'review' ? 'pill-amber' : estado === 'completed' ? 'pill-emerald' : 'pill-neutral'}`}>
                    {ESTADO_LABEL[estado]}
                  </span>
                </td>
                <td>{formatFecha(task.dueDate)}</td>
                <td>
                  <div className="task-table-actions" onClick={(e) => e.stopPropagation()}>
                    {puedeBorrar && (
                      <button className="icon-btn icon-btn-danger" title="Eliminar tarea" onClick={() => onDelete(task._id)}>
                        <X size={15} />
                      </button>
                    )}
                    {puedeTocarCheck && (
                      <button className="icon-btn icon-btn-success" title={tituloBoton} onClick={() => onToggle(task)}>
                        <Check size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TaskTable;
