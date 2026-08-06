// En producción no devolvemos error.message al cliente (puede filtrar detalles
// internos de Mongo/Mongoose) — en desarrollo se mantiene para poder debuggear.
const detalleError = (error) => (process.env.NODE_ENV === 'production' ? undefined : error.message);

module.exports = { detalleError };
