import Modal from './Modal';
import './AlertModal.css';

// Alerta genérica de un solo botón (fecha inválida, acción restringida, etc.)
// — mismo look en toda la app, solo cambian ícono/título/mensaje/botón.
const AlertModal = ({ isOpen, onClose, icon: Icon, title, children, buttonLabel = 'Aceptar' }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="">
    <div className="alert-modal">
      <div className="alert-modal-icon"><Icon size={26} /></div>
      <h3>{title}</h3>
      <div className="alert-modal-message">{children}</div>
      <button type="button" className="btn-primary alert-modal-btn" onClick={onClose}>{buttonLabel}</button>
    </div>
  </Modal>
);

export default AlertModal;
