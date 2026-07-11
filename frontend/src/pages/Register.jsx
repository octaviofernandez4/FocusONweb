import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { registerSchema } from '../schemas/authSchema';
import { registerUser, loginUser } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const onSubmit = async (data) => {
    try {
      await registerUser({ ...data, inviteToken: inviteToken || undefined });

      // Registrarse no devuelve token; iniciamos sesión automáticamente para no pedirle
      // al usuario que vuelva a escribir sus credenciales.
      const respuesta = await loginUser({ email: data.email, password: data.password });
      await login(respuesta.token);

      navigate('/app/today');
    } catch (error) {
      console.error('Error del backend:', error.response?.data);
      alert(error.response?.data?.mensaje || 'Hubo un error al registrarse');
    }
  };

  return (
    <div className="centered-page">
      <div className="glass-card auth-card">
        <div className="auth-brand">
          <CheckCircle2 size={28} strokeWidth={2.4} />
          <span>FocusOnWeb</span>
        </div>
        <p className="auth-tagline">
          {inviteToken ? 'Creá tu cuenta para unirte al equipo' : 'Creá tu organización en segundos'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Nombre</label>
            <div className={`input-with-icon ${errors.name ? 'input-error' : ''}`}>
              <User size={17} />
              <input type="text" placeholder="Ej: Octavio" {...register('name')} />
            </div>
            <span className="error-text">{errors.name?.message}</span>
          </div>

          <div className="form-group">
            <label>Apellido</label>
            <div className={`input-with-icon ${errors.lastname ? 'input-error' : ''}`}>
              <User size={17} />
              <input type="text" placeholder="Ej: Fernandez" {...register('lastname')} />
            </div>
            <span className="error-text">{errors.lastname?.message}</span>
          </div>

          <div className="form-group">
            <label>Email</label>
            <div className={`input-with-icon ${errors.email ? 'input-error' : ''}`}>
              <Mail size={17} />
              <input type="email" placeholder="vos@empresa.com" {...register('email')} />
            </div>
            <span className="error-text">{errors.email?.message}</span>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className={`input-with-icon ${errors.password ? 'input-error' : ''}`}>
              <Lock size={17} />
              <input type="password" placeholder="Mínimo 6 caracteres" {...register('password')} />
            </div>
            <span className="error-text">{errors.password?.message}</span>
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creando cuenta…' : 'Unirme a FocusOnWeb'}
          </button>
        </form>

        <div className="form-footer">
          ¿Ya tenés cuenta? <Link to={`/login${inviteToken ? `?invite=${inviteToken}` : ''}`}>Iniciá sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
