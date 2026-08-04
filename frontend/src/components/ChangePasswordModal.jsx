import { useState } from 'react';
import { changePassword } from '../services/profileService';
import Modal from './Modal';
import './NewTaskModal.css';

// Usado tanto en Configuración de empleado como de empresa — antes "Cambiar
// contraseña" era un botón de mentira (alert de "Próximamente"), no existía
// ni el endpoint en el backend.
const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const limpiarYCerrar = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('La contraseña nueva debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setIsSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      alert('Contraseña actualizada 🔒');
      limpiarYCerrar();
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.mensaje || 'Hubo un error al cambiar la contraseña');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={limpiarYCerrar} title="Cambiar contraseña">
      <form onSubmit={handleSubmit} className="new-task-modal-form">
        <div className="form-group">
          <label>Contraseña actual</label>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Contraseña nueva</label>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Confirmar contraseña nueva</label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <span className="error-text">{error}</span>
        </div>
        <div className="new-task-modal-actions">
          <button type="button" className="btn-ghost" onClick={limpiarYCerrar} disabled={isSaving}>Cancelar</button>
          <button type="submit" className="btn-primary new-task-modal-submit" disabled={isSaving}>
            {isSaving ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
