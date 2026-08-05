import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { joinOrg } from '../services/orgService';
import { usePageTitle } from '../hooks/usePageTitle';

// Controlador delgado: si ya hay sesión, se une directo a la organización;
// si no, manda a Registro (o Login) pasando el token de invitación.
const JoinInvite = () => {
  usePageTitle('Unirte al equipo');
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const procesar = async () => {
      const hayToken = Boolean(localStorage.getItem('token'));

      if (!hayToken) {
        navigate(`/register?invite=${token}`, { replace: true });
        return;
      }

      try {
        await joinOrg(token);
        navigate('/app/dashboard', { replace: true });
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.mensaje || 'El link de invitación no es válido o ya expiró');
      }
    };

    procesar();
  }, [token, navigate]);

  if (error) {
    return (
      <div className="centered-page">
        <div className="glass-card auth-card">
          <p className="error-text" style={{ textAlign: 'center', minHeight: 'auto' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="centered-page">
      <p style={{ color: 'var(--text-secondary)' }}>Uniéndote a la organización…</p>
    </div>
  );
};

export default JoinInvite;
