import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, CheckCircle2 } from 'lucide-react';
import { loginSchema } from '../schemas/authSchema';
import { loginUser } from '../services/authService';
import { joinOrg } from '../services/orgService';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const onSubmit = async (data) => {
    try {
      const respuesta = await loginUser(data);
      await login(respuesta.token);

      if (inviteToken) {
        await joinOrg(inviteToken);
      }

      navigate('/app/today');
    } catch (error) {
      console.error('Error del backend:', error.response?.data);
      alert(error.response?.data?.mensaje || 'Error al iniciar sesión. Revisá tus datos.');
    }
  };

  return (
    <div className="centered-page">
      <div className="glass-card auth-card">
        <div className="auth-brand">
          <CheckCircle2 size={28} strokeWidth={2.4} />
          <span>FocusOnWeb</span>
        </div>
        <p className="auth-tagline">Encontrá tu foco. Dominá tu día.</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Email</label>
            <div className={`input-with-icon ${errors.email ? 'input-error' : ''}`}>
              <Mail size={17} />
              <input
                type="email"
                placeholder="vos@empresa.com"
                {...register('email')}
              />
            </div>
            <span className="error-text">{errors.email?.message}</span>
          </div>

          <div className="form-group">
            <div className="label-row">
              <label>Contraseña</label>
              <span className="link-disabled" title="Todavía no disponible">¿Olvidaste tu contraseña?</span>
            </div>
            <div className={`input-with-icon ${errors.password ? 'input-error' : ''}`}>
              <Lock size={17} />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
            </div>
            <span className="error-text">{errors.password?.message}</span>
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="form-footer">
          ¿No tenés una cuenta? <Link to={`/register${inviteToken ? `?invite=${inviteToken}` : ''}`}>Registrate acá</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
