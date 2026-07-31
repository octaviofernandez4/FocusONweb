import { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { esFechaPasada } from '../utils/dateHelpers';
import Modal from './Modal';
import AlertModal from './AlertModal';
import './ReopenTaskModal.css';

// Se abre desde el botón "Reabrir tarea" (tareas ya confirmadas o vencidas):
// pide un motivo y una fecha de vencimiento nueva antes de reabrirla.
const ReopenTaskModal = ({ isOpen, onClose, task, onSubmit }) => {
  const [motivo, setMotivo] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [fechaInvalida, setFechaInvalida] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMotivo('');
      setNuevaFecha('');
    }
  }, [isOpen]);

  if (!task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!motivo.trim() || !nuevaFecha) return;
    if (esFechaPasada(nuevaFecha)) {
      setFechaInvalida(true);
      return;
    }
    onSubmit({ motivo: motivo.trim(), nuevaFecha: new Date(`${nuevaFecha}T23:59:59`).toISOString() });
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={<><RotateCcw size={17} className="reopen-modal-title-icon" /> ¿Reabrir tarea?</>}
    >
      <form onSubmit={handleSubmit} className="reopen-modal-form">
        <div className="reopen-modal-info">
          ¿Estás seguro de que querés reabrir esta tarea? Esto va a cambiar su estado a <strong>pendiente</strong> y
          va a notificar al empleado asignado.
        </div>

        <div className="form-group">
          <label>Motivo de la reapertura *</label>
          <textarea
            className="reopen-modal-textarea"
            rows={3}
            required
            placeholder="Describí por qué es necesario reabrir esta tarea…"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Nueva fecha de vencimiento *</label>
          <input
            type="date"
            required
            value={nuevaFecha}
            onChange={(e) => setNuevaFecha(e.target.value)}
          />
        </div>

        <div className="reopen-modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary reopen-modal-submit">
            <CheckCircle2 size={15} /> Confirmar reapertura
          </button>
        </div>
      </form>
    </Modal>

    <AlertModal
      isOpen={fechaInvalida}
      onClose={() => setFechaInvalida(false)}
      icon={AlertTriangle}
      title="Fecha inválida"
      buttonLabel="CORREGIR FECHA"
    >
      <p className="alert-modal-error">Error: no podés seleccionar una fecha que ya pasó.</p>
      <p>Para mantener la integridad del proyecto y asegurar un seguimiento preciso, los plazos de las tareas deben establecerse en fechas futuras.</p>
    </AlertModal>
    </>
  );
};

export default ReopenTaskModal;
