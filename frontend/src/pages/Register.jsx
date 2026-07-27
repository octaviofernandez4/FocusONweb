import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Building2, UserRound, CheckCircle2, ArrowRight } from 'lucide-react';
import { registerSchema } from '../schemas/authSchema';
import { registerUser, loginUser } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import PasswordField from '../components/PasswordField';
import BackHomeButton from '../components/BackHomeButton';
import buildingPhoto from '../assets/pexels-wellingtonsilva-14589851.jpg';
import './Register.css';

const Register = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  // Elegí si te registrás como empresa (creás tu organización) o como empleado
  // (te van a sumar a una). Cada tipo termina en una página distinta.
  const [accountType, setAccountType] = useState('empresa');
  const esEmpresa = !inviteToken && accountType === 'empresa';

  const onSubmit = async (data) => {
    try {
      await registerUser({ ...data, inviteToken: inviteToken || undefined });

      // Registrarse no devuelve token; iniciamos sesión automáticamente para no pedirle
      // al usuario que vuelva a escribir sus credenciales.
      const respuesta = await loginUser({ email: data.email, password: data.password });
      await login(respuesta.token);

      navigate(esEmpresa ? '/app/today' : '/employee-home');
    } catch (error) {
      console.error('Error del backend:', error.response?.data);
      alert(error.response?.data?.mensaje || 'Hubo un error al registrarse');
    }
  };

  return (
    <div className="centered-page">
      <BackHomeButton />
      <div className="card-panel register-card">
        <div className="register-image" style={{ backgroundImage: `url(${buildingPhoto})` }}>
          <div className="register-image-badge">
            <CheckCircle2 size={20} strokeWidth={2.4} />
          </div>
          <div className="register-image-text">
            <h3>Impulsá la productividad de tu equipo.</h3>
            <p>Sumate a los equipos que ya organizan su trabajo con claridad. Creá tu espacio inteligente hoy.</p>
          </div>
        </div>

        <div className="register-form-panel">
          <h2 className="register-title">
            {inviteToken ? 'Unite al equipo' : 'Creá tu espacio de trabajo'}
          </h2>
          <p className="auth-tagline register-tagline">
            {inviteToken ? 'Creá tu cuenta para unirte a la organización' : 'Empezá a organizar tu equipo en minutos.'}
          </p>

          {!inviteToken && (
            <div className="account-type-toggle" role="group" aria-label="Tipo de cuenta">
              <button
                type="button"
                className={accountType === 'empresa' ? 'is-active' : ''}
                onClick={() => setAccountType('empresa')}
              >
                <Building2 size={16} /> Empresa
              </button>
              <button
                type="button"
                className={accountType === 'empleado' ? 'is-active' : ''}
                onClick={() => setAccountType('empleado')}
              >
                <UserRound size={16} /> Empleado
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="register-row">
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
            </div>

            <div className="form-group">
              <label>Email</label>
              <div className={`input-with-icon ${errors.email ? 'input-error' : ''}`}>
                <Mail size={17} />
                <input type="email" placeholder="vos@empresa.com" {...register('email')} />
              </div>
              <span className="error-text">{errors.email?.message}</span>
            </div>

            {esEmpresa && (
              <div className="form-group">
                <label>Nombre de la empresa</label>
                <div className="input-with-icon">
                  <Building2 size={17} />
                  <input type="text" placeholder="Ej: Acme Corp" {...register('companyName')} />
                </div>
                <span className="error-text">{errors.companyName?.message}</span>
              </div>
            )}

            <div className="form-group">
              <label>Contraseña</label>
              <PasswordField registration={register('password')} placeholder="Mínimo 6 caracteres" hasError={Boolean(errors.password)} />
              <span className="error-text">{errors.password?.message}</span>
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creando espacio…' : (
                <>Crear espacio de trabajo <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="form-footer">
            ¿Ya tenés cuenta? <Link to={`/login${inviteToken ? `?invite=${inviteToken}` : ''}`}>Iniciá sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
