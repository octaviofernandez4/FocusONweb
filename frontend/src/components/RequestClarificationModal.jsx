import { useState, useEffect } from 'react';
import { Send, Info } from 'lucide-react';
import Modal from './Modal';
import './RequestClarificationModal.css';

// Se abre desde TaskDetail.jsx cuando la empresa quiere preguntarle algo a la
// persona asignada antes de aprobar o reabrir la tarea.
const RequestClarificationModal = ({ isOpen, onClose, task, onSubmit }) => {
  const [pregunta, setPregunta] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPregunta('');
    }
  }, [isOpen]);

  if (!task) return null;

  const nombreAsignado = task.assignedTo?.name || 'la persona asignada';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pregunta.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ pregunta: pregunta.trim() });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Solicitar aclaración">
      <form onSubmit={handleSubmit} className="clarification-modal-form">
        <p className="clarification-modal-subtitle">
          Pedile a {nombreAsignado} que aclare algo antes de aprobar o reabrir &quot;{task.title}&quot;.
        </p>

        <div className="form-group">
          <label>Tu pregunta o comentario</label>
          <textarea
            className="clarification-modal-textarea"
            rows={4}
            required
            placeholder="Ej: ¿Podés confirmar si este archivo incluye la versión final?"
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
          />
        </div>

        <p className="clarification-modal-hint">
          <Info size={13} /> Le va a llegar una notificación y un email para que responda.
        </p>

        <div className="clarification-modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
          <button type="submit" className="btn-primary clarification-modal-submit" disabled={isSubmitting || !pregunta.trim()}>
            {isSubmitting ? 'Enviando…' : <>Enviar solicitud <Send size={15} /></>}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RequestClarificationModal;
