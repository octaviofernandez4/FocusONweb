import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Modal from './Modal';
import './ApproveTaskModal.css';

const getInitials = (name, lastname) => `${name?.[0] || ''}${lastname?.[0] || ''}`.toUpperCase() || '?';

const NIVELES = [
  { value: 'standard', label: 'Estándar' },
  { value: 'needs_adjustments', label: 'Requiere ajustes' },
];

// Se abre al confirmar una tarea (desde Tareas del equipo o desde el detalle):
// pide el nivel de calidad y deja un comentario final opcional para el registro.
const ApproveTaskModal = ({ isOpen, onClose, task, onSubmit }) => {
  const [nivel, setNivel] = useState('standard');
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNivel('standard');
      setComentario('');
    }
  }, [isOpen]);

  if (!task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ qualityLevel: nivel, comentario: comentario.trim() });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="¿Confirmar aprobación de tarea?">
      <p className="approve-modal-subtitle">Estás a punto de marcar esta tarea como completada y verificada.</p>

      <form onSubmit={handleSubmit} className="approve-modal-form">
        <div className="approve-modal-task-box">
          <div className="approve-modal-assignee">
            <span className="approve-modal-avatar">{getInitials(task.assignedTo?.name, task.assignedTo?.lastname)}</span>
            <div>
              <span className="approve-modal-task-label">TAREA COMPLETADA POR</span>
              <p className="approve-modal-task-value">
                {task.assignedTo?.name ? `${task.assignedTo.name} ${task.assignedTo.lastname || ''}` : 'Sin asignar'}
              </p>
            </div>
          </div>
          {task.project?.name && (
            <div className="approve-modal-project">
              <span className="approve-modal-task-label">PROYECTO</span>
              <p className="approve-modal-task-value">{task.project.name}</p>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Nivel de calidad</label>
          <div className="approve-modal-levels">
            {NIVELES.map((n) => (
              <button
                key={n.value}
                type="button"
                className={`approve-modal-level ${nivel === n.value ? 'is-active' : ''}`}
                onClick={() => setNivel(n.value)}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Comentarios finales (opcional)</label>
          <textarea
            className="approve-modal-textarea"
            rows={3}
            placeholder="Añadí un comentario, felicitación o notas para el registro…"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
        </div>

        <div className="approve-modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary approve-modal-submit">
            <CheckCircle2 size={15} /> Aprobar y finalizar
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ApproveTaskModal;
