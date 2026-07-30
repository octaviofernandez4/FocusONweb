import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { updateProfile } from '../services/profileService';
import { uploadFile } from '../services/uploadService';
import NotificationsPanel from './NotificationsPanel';
import './TopBar.css';

const getInitials = (name, lastname) =>
  `${name?.[0] || ''}${lastname?.[0] || ''}`.toUpperCase() || '?';

// Barra superior de la cuenta empleado. El avatar es una foto de perfil real
// (Cloudinary), no un placeholder — se sube al hacer clic y queda visible
// también para la empresa en Configuración > Miembros del equipo.
const TopBar = () => {
  const { user, refreshProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploading(true);
    try {
      const subido = await uploadFile(file);
      await updateProfile({ avatarUrl: subido.url });
      await refreshProfile();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al subir la foto de perfil');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-actions">
        <NotificationsPanel />
        <button
          type="button"
          className="topbar-avatar"
          title="Cambiar foto de perfil"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 size={16} className="topbar-avatar-spinner" />
          ) : user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Tu foto de perfil" className="topbar-avatar-img" />
          ) : (
            getInitials(user?.name, user?.lastname)
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg"
          hidden
          onChange={handleAvatarChange}
        />
      </div>
    </header>
  );
};

export default TopBar;
