import { Link } from 'react-router-dom';
import { Hammer } from 'lucide-react';
import BackHomeButton from '../components/BackHomeButton';

// Placeholder: destino de las cuentas registradas como "Empleado".
// El flujo/panel real para empleados todavía no está construido.
const EmployeeHome = () => {
  return (
    <div className="centered-page">
      <BackHomeButton />
      <div className="glass-card auth-card" style={{ textAlign: 'center' }}>
        <Hammer size={32} color="var(--color-electric-light)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>¡Cuenta creada!</h2>
        <p className="auth-tagline">
          Todavía estamos construyendo la experiencia para empleados. Mientras tanto, entrá al panel general.
        </p>
        <Link to="/app/today" className="btn-primary" style={{ display: 'block', marginTop: '1rem' }}>
          Ir al panel
        </Link>
      </div>
    </div>
  );
};

export default EmployeeHome;
