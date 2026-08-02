// src/app.js (o index.js, según como se llame tu archivo principal)
require('dotenv').config(); // SIEMPRE en la primera línea para cargar las claves
const validateEnv = require('./config/validateEnv');
validateEnv(); // corta el arranque con un error claro si falta algo obligatorio

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { iniciarLimpiezaAutomatica } = require('./jobs/cleanupOldTasks');

// Importamos nuestras rutas
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const orgRoutes = require('./routes/orgRoutes');
const projectRoutes = require('./routes/projectRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Casi todo hosting (Render, Railway, Fly, Heroku, etc.) pone la app detrás de
// su propio proxy — sin esto, req.ip y el resto de encabezados que dependen
// de X-Forwarded-* quedan mal, y con eso el rate limiter no identifica bien
// a cada cliente.
app.set('trust proxy', 1);

// Conexión a la base de datos
connectDB();

// Borra solas las tareas completadas/vencidas de más de 30 días (ver jobs/cleanupOldTasks.js)
iniciarLimpiezaAutomatica();

app.use(helmet());

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Ruta de salud: la usan los hosting providers para chequear que el servicio
// esté vivo (algunos pegan a "/", otros a la que configures en su panel).
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Configuración de Rutas

app.use('/api', userRoutes);

app.use('/api/tasks', taskRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/uploads', uploadRoutes);

// Ruta de prueba
app.get('/api', (req, res) => {
    res.json({ mensaje: '¡Servidor del Task Manager funcionando! 🚀' });
});

// Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Manejador de errores centralizado
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});