import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, AlertTriangle, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getTaskAccess, ESTADO_LABEL, PRIORIDAD_LABEL } from '../utils/taskAccess';
import { getProjectColor } from '../utils/projectColors';
import ApproveTaskModal from './ApproveTaskModal';
import ConfirmMarkReadyModal from './ConfirmMarkReadyModal';
import AlertModal from './AlertModal';
import Modal from './Modal';
import './TaskTable.css';

const formatFecha = (dueDate) => {
  if (!dueDate) return 'Sin fecha';
  return new Date(dueDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
};

// Tabla de tareas reutilizada por "Tareas del equipo" y el Dashboard de empresa.
// Las acciones de cada fila respetan las mismas reglas que TaskCard (ver utils/taskAccess).
const TaskTable = ({ tasks, onToggle, onApprove, onDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tareaAAprobar, setTareaAAprobar] = useState(null);
  // Sirve para borrar una tarea en cualquier estado, incluida una recién
  // enviada a revisión (pendingReview) — puedeBorrar no depende del estado.
  const [tareaAEliminar, setTareaAEliminar] = useState(null);
  // Mismo flujo que en "Mis tareas": marcar como lista pide confirmación;
  // destildar una ya enviada queda restringido a la empresa.
  const [tareaAConfirmar, setTareaAConfirmar] = useState(null);
  const [accionRestringida, setAccionRestringida] = useState(false);

  const abrirTarea = (task) => navigate(`/app/tasks/${task._id}`, { state: { task } });

  const confirmarEliminar = () => {
    if (!tareaAEliminar) return;
    onDelete(tareaAEliminar._id);
    setTareaAEliminar(null);
  };

  const confirmarRealizacion = () => {
    if (!tareaAConfirmar) return;
    onToggle(tareaAConfirmar);
    setTareaAConfirmar(null);
  };

  const handleCheckClick = (task, esEmpresa, esReapertura) => {
    if (esEmpresa && !esReapertura) {
      // Confirmar (no reabrir) pasa por el modal de aprobación.
      setTareaAAprobar(task);
    } else if (esEmpresa) {
      // Reabrir sigue siendo instantáneo, como hasta ahora.
      onToggle(task);
    } else if (task.pendingReview) {
      // El empleado ya no puede destildar una tarea que envió.
      setAccionRestringida(true);
    } else {
      // Marcar como lista pide la misma confirmación que en "Mis tareas".
      setTareaAConfirmar(task);
    }
  };

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
            const { estado, esEmpresa, esAsignatario, puedeTocarCheck, puedeBorrar, esReapertura, tituloBoton } = getTaskAccess(task, user);
            const puedeAbrir = esEmpresa || esAsignatario;
            const color = getProjectColor(task.project?.color);
            // El tilde del empleado en esta tabla es solo para "ya la tengo en
            // progreso, la mando a revisión" — no para arrancarla ni para
            // destildar un envío (esto último ya lo bloquea el modal de acción
            // restringida). La empresa sigue viendo su tilde en cualquier estado.
            const mostrarCheck = esEmpresa ? puedeTocarCheck : (puedeTocarCheck && estado === 'progress');
            return (
              <tr
                key={task._id}
                className={puedeAbrir ? 'is-clickable' : ''}
                onClick={puedeAbrir ? () => abrirTarea(task) : undefined}
              >
                <td>
                  <p className="task-table-title">{task.title}</p>
                  {task.project?.name && (
                    <span className="pill" style={{ background: color.bg, color: color.text }}>{task.project.name.toUpperCase()}</span>
                  )}
                </td>
                <td data-label="Asignado a">{task.assignedTo?.name ? `${task.assignedTo.name} ${task.assignedTo.lastname || ''}` : 'Sin asignar'}</td>
                <td data-label="Prioridad">
                  <span className={`pill ${task.priority === 'high' ? 'pill-rose' : task.priority === 'low' ? 'pill-neutral' : 'pill-sky'}`}>
                    {PRIORIDAD_LABEL[task.priority] || 'MEDIA'}
                  </span>
                </td>
                <td data-label="Estado">
                  <span className={`pill ${estado === 'review' ? 'pill-amber' : estado === 'completed' ? 'pill-emerald' : estado === 'progress' ? 'pill-sky' : 'pill-neutral'}`}>
                    {ESTADO_LABEL[estado]}
                  </span>
                </td>
                <td data-label="Fecha límite">{formatFecha(task.dueDate)}</td>
                <td data-label="Acciones">
                  <div className="task-table-actions" onClick={(e) => e.stopPropagation()}>
                    {puedeBorrar && (
                      <button className="icon-btn icon-btn-danger" title="Eliminar tarea" onClick={() => setTareaAEliminar(task)}>
                        <X size={15} />
                      </button>
                    )}
                    {mostrarCheck && (
                      <button
                        className="icon-btn icon-btn-success"
                        title={tituloBoton}
                        onClick={() => handleCheckClick(task, esEmpresa, esReapertura)}
                      >
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

      <ApproveTaskModal
        isOpen={!!tareaAAprobar}
        onClose={() => setTareaAAprobar(null)}
        task={tareaAAprobar}
        onSubmit={(data) => {
          onApprove(tareaAAprobar, data);
          setTareaAAprobar(null);
        }}
      />

      <Modal isOpen={!!tareaAEliminar} onClose={() => setTareaAEliminar(null)} title="Eliminar tarea">
        <div className="confirm-danger">
          <div className="confirm-danger-icon"><AlertTriangle size={24} /></div>
          <h3>¿Eliminar tarea?</h3>
          <p>
            ¿Estás seguro de que querés eliminar &quot;<strong>{tareaAEliminar?.title}</strong>&quot;? Esta acción no
            se puede deshacer.
          </p>
          <div className="confirm-danger-actions">
            <button className="btn-ghost" onClick={() => setTareaAEliminar(null)}>Cancelar</button>
            <button className="btn-danger" onClick={confirmarEliminar}>Eliminar tarea</button>
          </div>
        </div>
      </Modal>

      <ConfirmMarkReadyModal
        isOpen={!!tareaAConfirmar}
        onClose={() => setTareaAConfirmar(null)}
        task={tareaAConfirmar}
        onConfirm={confirmarRealizacion}
      />

      <AlertModal
        isOpen={accionRestringida}
        onClose={() => setAccionRestringida(false)}
        icon={Lock}
        title="Acción restringida"
      >
        <p>Solo una cuenta de empresa puede confirmar o reabrir una tarea.</p>
      </AlertModal>
    </div>
  );
};

export default TaskTable;
