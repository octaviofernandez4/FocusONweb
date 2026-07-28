import { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import { updateTask } from '../services/taskService';
import Modal from './Modal';
import './NewTaskModal.css';

// Reasignar una tarea existente a otro miembro del equipo — solo cuenta empresa
// (el backend también lo exige vía requireCompanyAccount en la ruta de tareas).
const ReassignTaskModal = ({ isOpen, onClose, task, onReassigned }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(task?.assignedTo?.email || '');
    }
  }, [isOpen, task]);

  if (!task) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateTask(task._id, { ...task, assignedToEmail: email });
      await onReassigned();
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al reasignar la tarea');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reasignar tarea">
      <p className="new-task-modal-subtitle">Elegí a quién le corresponde ahora "{task.title}".</p>
      <form onSubmit={onSubmit} className="new-task-modal-form">
        <div className="form-group">
          <label>Nuevo responsable (email)</label>
          <div className="input-with-icon">
            <Mail size={17} />
            <input
              type="email"
              required
              placeholder="ejemplo@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="new-task-modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary new-task-modal-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Reasignando…' : 'Reasignar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReassignTaskModal;
