// Paleta chica de colores predefinidos para proyectos/etiquetas.
// El backend guarda solo el `key` (ej. "indigo"); acá se resuelve a valores CSS reales.
export const PROJECT_COLORS = {
  indigo: { bg: 'rgba(99, 102, 241, 0.16)', text: '#a5b4fc', dot: '#6366f1' },
  pink: { bg: 'rgba(236, 72, 153, 0.16)', text: '#f9a8d4', dot: '#ec4899' },
  emerald: { bg: 'rgba(16, 185, 129, 0.16)', text: '#6ee7b7', dot: '#10b981' },
  amber: { bg: 'rgba(245, 158, 11, 0.16)', text: '#fcd34d', dot: '#f59e0b' },
  sky: { bg: 'rgba(14, 165, 233, 0.16)', text: '#7dd3fc', dot: '#0ea5e9' },
  violet: { bg: 'rgba(139, 92, 246, 0.16)', text: '#c4b5fd', dot: '#8b5cf6' },
  rose: { bg: 'rgba(244, 63, 94, 0.16)', text: '#fda4af', dot: '#f43f5e' },
  teal: { bg: 'rgba(20, 184, 166, 0.16)', text: '#5eead4', dot: '#14b8a6' },
};

export const PROJECT_COLOR_KEYS = Object.keys(PROJECT_COLORS);

export const getProjectColor = (key) => PROJECT_COLORS[key] || PROJECT_COLORS.indigo;

// Asigna un color en round-robin según cuántos proyectos ya existen, para que
// el modal de "+ Nuevo Proyecto" proponga un color distinto por defecto.
export const nextProjectColor = (existingCount) =>
  PROJECT_COLOR_KEYS[existingCount % PROJECT_COLOR_KEYS.length];
