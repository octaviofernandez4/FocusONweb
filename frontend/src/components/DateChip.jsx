import { CalendarDays } from 'lucide-react';
import './DateChip.css';

const formatLabel = (isoDate) => {
  if (!isoDate) return 'Sin fecha';

  const hoy = new Date();
  const fecha = new Date(`${isoDate}T00:00:00`);
  const hoyStr = hoy.toISOString().slice(0, 10);
  const mañana = new Date(hoy);
  mañana.setDate(hoy.getDate() + 1);
  const mañanaStr = mañana.toISOString().slice(0, 10);

  if (isoDate === hoyStr) return 'Hoy';
  if (isoDate === mañanaStr) return 'Mañana';

  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
};

// Chip con un input nativo de fecha (sin librería de calendario) que muestra
// una etiqueta amigable ("Hoy" / "Mañana" / fecha corta) por encima.
const DateChip = ({ value, onChange }) => (
  <label className="date-chip">
    <CalendarDays size={14} />
    <span>{formatLabel(value)}</span>
    <input type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  </label>
);

export default DateChip;
