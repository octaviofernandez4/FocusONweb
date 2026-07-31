import { CheckCircle2 } from 'lucide-react';
import Modal from './Modal';
import './ConfirmMarkReadyModal.css';

// Confirma que el empleado marque una tarea como lista para revisión. Se usa
// desde "Mis tareas" (el tilde) y desde el tablero de Proyectos (arrastrar la
// tarjeta a "En progreso") — misma acción, dos formas de llegar a ella.
const ConfirmMarkReadyModal = ({ isOpen, onClose, task, onConfirm }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Confirmar tarea">
    <div className="confirm-task">
      <div className="confirm-task-icon"><CheckCircle2 size={26} /></div>
      <h3>¿Confirmar realización de la tarea?</h3>
      <p>
        {task && `"${task.title}"`} se va a marcar como lista para revisión y tu supervisor va a recibir la
        notificación.
      </p>
      <div className="confirm-task-actions">
        <button className="btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={onConfirm}>Sí, confirmar</button>
      </div>
    </div>
  </Modal>
);

export default ConfirmMarkReadyModal;
