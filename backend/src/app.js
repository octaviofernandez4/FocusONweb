// src/app.js (o index.js, según como se llame tu archivo principal)
require('dotenv').config(); // SIEMPRE en la primera línea para cargar las claves
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Importamos nuestras rutas
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const orgRoutes = require('./routes/orgRoutes');
const projectRoutes = require('./routes/projectRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Conexión a la base de datos
connectDB();

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

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