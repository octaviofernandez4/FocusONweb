import './ProgressBar.css';

const ProgressBar = ({ total, done }) => {
  const porcentaje = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="progress-card">
      <div className="progress-card-top">
        <span className="progress-label">PROGRESO</span>
        <div className="progress-stats">
          <span className="progress-percentage">{porcentaje}%</span>
          <span className="progress-count">{total} tareas</span>
          <span className="progress-count progress-done">{done} listas</span>
        </div>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  );
};

export default ProgressBar;
