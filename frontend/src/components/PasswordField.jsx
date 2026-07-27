import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

// Input de contraseña con botón para mostrar/ocultar. `registration` es el objeto
// que devuelve react-hook-form's register('campo'), se spreadea directo al input.
const PasswordField = ({ registration, placeholder = '••••••••', hasError }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`input-with-icon password-field ${hasError ? 'input-error' : ''}`}>
      <Lock size={17} />
      <input type={visible ? 'text' : 'password'} placeholder={placeholder} {...registration} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
};

export default PasswordField;
