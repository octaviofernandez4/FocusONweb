import './StatCard.css';

// Si recibe `onClick`, la card actúa como un chip de filtro clickeable (con
// hover y un estado activo vía `isActive`) — si no, se queda como antes, solo
// informativa.
const StatCard = ({ icon: Icon, label, value, hint, tone, onClick, isActive }) => (
  <div
    className={`stat-card ${onClick ? 'is-clickable' : ''} ${isActive ? 'is-active' : ''}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
  >
    <div className="stat-card-top">
      <span className="stat-label">{label}</span>
      {Icon && <Icon size={18} className={`stat-icon stat-icon-${tone || 'neutral'}`} />}
    </div>
    <p className={`stat-value stat-value-${tone || 'neutral'}`}>{value}</p>
    {hint && <p className="stat-hint">{hint}</p>}
  </div>
);

export default StatCard;
