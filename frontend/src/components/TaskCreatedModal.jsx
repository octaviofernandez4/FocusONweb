import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import Modal from './Modal';
import './TaskCreatedModal.css';

// Se muestra al terminar de asignar una tarea nueva — confirma a quién se le
// notificó, usando su nombre real en vez de un genérico "al empleado".
const TaskCreatedModal = ({ isOpen, onClose, assigneeName }) => {
  const navigate = useNavigate();

  const irAlPanel = () => {
    onClose();
    navigate('/app/dashboard');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="task-created-modal">
        <div className="task-created-modal-icon"><CheckCircle2 size={28} /></div>
        <h3>Tarea enviada con éxito</h3>
        <p>Tu tarea fue registrada y notificada a {assigneeName || 'la persona asignada'} correctamente.</p>
        <div className="task-created-modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cerrar</button>
          <button type="button" className="btn-primary task-created-modal-btn" onClick={irAlPanel}>
            Ir al panel principal
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TaskCreatedModal;
