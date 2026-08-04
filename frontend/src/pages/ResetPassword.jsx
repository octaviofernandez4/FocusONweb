import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { resetPassword } from '../services/authService';
import PasswordField from '../components/PasswordField';
import BackHomeButton from '../components/BackHomeButton';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      alert('Contraseña restablecida 🔒 — ya podés iniciar sesión');
      navigate('/login');
    } catch (error) {
      console.error('Error del backend:', error.response?.data);
      setError(error.response?.data?.mensaje || 'El link no es válido o ya venció');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="centered-page">
      <BackHomeButton />
      <div className="glass-card auth-card">
        <div className="auth-icon-badge">
          <CheckCircle2 size={26} strokeWidth={2.4} />
        </div>
        <h2 style={{ marginBottom: '0.3rem' }}>Elegí tu nueva contraseña</h2>
        <p className="auth-tagline">Este link vale solo por una hora desde que lo pediste.</p>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Contraseña nueva</label>
            <PasswordField
              registration={{ value: newPassword, onChange: (e) => setNewPassword(e.target.value) }}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="form-group">
            <label>Confirmar contraseña</label>
            <PasswordField
              registration={{ value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value) }}
            />
            <span className="error-text">{error}</span>
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Restablecer contraseña'}
          </button>
        </form>

        <div className="form-footer">
          <Link to="/login">Volver a iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
