const express = require('express');
const request = require('supertest');
const { validarRegistro, validarCambioContrasena, validarResetContrasena } = require('../src/validators/userValidator');

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.post('/register', validarRegistro, (req, res) => res.status(200).json({ body: req.body }));
    app.post('/change-password', validarCambioContrasena, (req, res) => res.status(200).json({ body: req.body }));
    app.post('/reset-password', validarResetContrasena, (req, res) => res.status(200).json({ body: req.body }));
    return app;
};

describe('longitud máxima de contraseña', () => {
    const app = buildApp();
    const passwordLarga = 'a'.repeat(129);
    const passwordValida = 'a'.repeat(128);

    it('rechaza una contraseña de registro de más de 128 caracteres', async () => {
        const res = await request(app).post('/register').send({
            name: 'Octavio',
            lastname: 'Fernandez',
            email: 'octavio@example.com',
            password: passwordLarga
        });

        expect(res.status).toBe(400);
    });

    it('acepta una contraseña de registro de exactamente 128 caracteres', async () => {
        const res = await request(app).post('/register').send({
            name: 'Octavio',
            lastname: 'Fernandez',
            email: 'octavio@example.com',
            password: passwordValida
        });

        expect(res.status).toBe(200);
    });

    it('rechaza una contraseña nueva de más de 128 caracteres al cambiar contraseña', async () => {
        const res = await request(app).post('/change-password').send({
            currentPassword: 'actual123',
            newPassword: passwordLarga
        });

        expect(res.status).toBe(400);
    });

    it('rechaza una contraseña nueva de más de 128 caracteres al resetear contraseña', async () => {
        const res = await request(app).post('/reset-password').send({
            newPassword: passwordLarga
        });

        expect(res.status).toBe(400);
    });
});
