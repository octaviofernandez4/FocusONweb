const express = require('express');
const request = require('supertest');
const uploadRateLimiter = require('../src/middlewares/uploadRateLimiter');

const buildApp = () => {
    const app = express();
    app.use((req, res, next) => {
        req.user = { id: req.header('x-test-user-id') || 'usuario-1' };
        next();
    });
    app.post('/uploads', uploadRateLimiter, (req, res) => res.status(200).json({ ok: true }));
    return app;
};

describe('uploadRateLimiter', () => {
    const app = buildApp();

    it('permite hasta 60 subidas para el mismo usuario y bloquea la siguiente', async () => {
        for (let i = 0; i < 60; i++) {
            const res = await request(app).post('/uploads').set('x-test-user-id', 'usuario-1');
            expect(res.status).toBe(200);
        }

        const bloqueado = await request(app).post('/uploads').set('x-test-user-id', 'usuario-1');
        expect(bloqueado.status).toBe(429);
    });

    it('no bloquea subidas de un usuario distinto', async () => {
        const res = await request(app).post('/uploads').set('x-test-user-id', 'usuario-2');
        expect(res.status).toBe(200);
    });
});
