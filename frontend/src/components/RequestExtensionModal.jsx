import { useState, useEffect } from 'react';
import { Send, CalendarClock } from 'lucide-react';
import Modal from './Modal';
import './RequestExtensionModal.css';

const formatFechaHora = (fecha) =>
  fecha ? new Date(fecha).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

// input type="datetime-local" necesita YYYY-MM-DDTHH:mm en hora local, no UTC.
const toDateTimeLocalValue = (fecha) => {
  const base = fecha ? new Date(fecha) : new Date();
  const local = new Date(base.getTime() - base.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

// Se abre desde una fila de "Incompletas" cuando el empleado asignado quiere
// pedir más tiempo — pide motivo y fecha propuesta para que la empresa decida.
const RequestExtensionModal = ({ isOpen, onClose, task, onSubmit }) => {
  const [motivo, setMotivo] = useState('');
  const [fechaPropuesta, setFechaPropuesta] = useState('');

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMotivo('');
      setFechaPropuesta(toDateTimeLocalValue(null));
    }
  }, [isOpen]);

  if (!task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!motivo.trim() || !fechaPropuesta) return;
    onSubmit({ motivo: motivo.trim(), fechaPropuesta: new Date(fechaPropuesta).toISOString() });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Solicitar extensión de tiempo">
      <form onSubmit={handleSubmit} className="extension-modal-form">
        <div className="extension-modal-task-box">
          <span className="extension-modal-task-label">TAREA AFECTADA</span>
          <p className="extension-modal-task-title">{task.title}</p>
          <span className="extension-modal-task-due">
            <CalendarClock size={14} /> Vencida: {formatFechaHora(task.dueDate)}
          </span>
        </div>

        <div className="form-group">
          <label>Motivo del retraso *</label>
          <textarea
            className="extension-modal-textarea"
            rows={3}
            required
            placeholder="Explicá por qué no se pudo cumplir con la fecha de entrega original…"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Nueva fecha de entrega propuesta *</label>
          <input
            type="datetime-local"
            required
            value={fechaPropuesta}
            onChange={(e) => setFechaPropuesta(e.target.value)}
          />
        </div>

        <div className="extension-modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary extension-modal-submit">
            <Send size={15} /> Enviar petición
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RequestExtensionModal;
