import { useState, useEffect, useCallback } from 'react';
import { getTaskStats } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import StatCard from '../components/StatCard';
import './Analytics.css';

const Analytics = () => {
  const { projects } = useOrg();
  const { user } = useAuth();
  const esEmpresa = user?.accountType === 'empresa';
  const [stats, setStats] = useState(null);

  const cargarStats = useCallback(async () => {
    try {
      const data = await getTaskStats(esEmpresa ? {} : { mine: true });
      setStats(data);
    } catch (error) {
      console.error('Error al cargar analíticas:', error);
    }
  }, [esEmpresa]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarStats();
  }, [cargarStats]);

  return (
    <div className="analytics-page">
      <h1>Analíticas</h1>
      <p className="page-subtitle">Cómo viene avanzando tu organización.</p>

      {!stats ? (
        <p className="empty-state">Cargando…</p>
      ) : (
        <div className="analytics-stats">
          <StatCard label="TOTAL COMPLETADAS" value={stats.totalCompleted} hint={`+${stats.completedThisWeek} esta semana`} tone="success" />
          <StatCard label="TASA DE CUMPLIMIENTO" value={`${stats.completionRate}%`} hint="Completadas vs. perdidas." tone="success" />
          <StatCard label="TAREAS PERDIDAS" value={stats.missedCount} hint="Requieren atención." tone="danger" />
          <StatCard label="PROYECTOS" value={projects.length} hint="Proyectos activos en tu organización." tone="neutral" />
        </div>
      )}
    </div>
  );
};

export default Analytics;
