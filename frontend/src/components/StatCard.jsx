import './StatCard.css';

const StatCard = ({ icon: Icon, label, value, hint, tone }) => (
  <div className="stat-card">
    <div className="stat-card-top">
      <span className="stat-label">{label}</span>
      {Icon && <Icon size={18} className={`stat-icon stat-icon-${tone || 'neutral'}`} />}
    </div>
    <p className={`stat-value stat-value-${tone || 'neutral'}`}>{value}</p>
    {hint && <p className="stat-hint">{hint}</p>}
  </div>
);

export default StatCard;
