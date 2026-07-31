import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import './Modal.css';

// Portal a document.body: la página se anima con framer-motion (ver AppShell),
// y cualquier transform en un ancestro crea un containing block nuevo para los
// hijos position:fixed — sin el portal, el overlay quedaría recortado dentro
// del contenido de la página en vez de cubrir toda la pantalla.
const Modal = ({ isOpen, onClose, title, children, size }) => createPortal(
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="modal-overlay"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        <motion.div
          className={`modal-card glass-card ${size === 'lg' ? 'modal-card-lg' : ''}`}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>,
  document.body
);

export default Modal;
