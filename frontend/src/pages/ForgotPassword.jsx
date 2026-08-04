import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2 } from 'lucide-react';
import { forgotPassword } from '../services/authService';
import BackHomeButton from '../components/BackHomeButton';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      await forgotPassword(email.trim());
      // El backend siempre responde lo mismo exista o no ese email — no hay
      // nada más que distinguir acá, por diseño (no filtrar qué emails existen).
      setEnviado(true);
    } catch (error) {
      console.error('Error del backend:', error.response?.data);
      alert(error.response?.data?.mensaje || 'Hubo un error al pedir la recuperación');
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
        <h2 style={{ marginBottom: '0.3rem' }}>Recuperar contraseña</h2>
        <p className="auth-tagline">
          {enviado
            ? 'Revisá tu email — te mandamos un link si esa cuenta existe.'
            : 'Ingresá tu email y te mandamos un link para restablecerla.'}
        </p>

        {!enviado && (
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Email</label>
              <div className="input-with-icon">
                <Mail size={17} />
                <input
                  type="email"
                  placeholder="vos@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando…' : 'Mandar link de recuperación'}
            </button>
          </form>
        )}

        <div className="form-footer">
          <Link to="/login">Volver a iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
