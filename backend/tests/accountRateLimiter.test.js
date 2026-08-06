const express = require('express');
const request = require('supertest');
const accountRateLimiter = require('../src/middlewares/accountRateLimiter');

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.post('/login', accountRateLimiter, (req, res) => res.status(200).json({ ok: true }));
    return app;
};

describe('accountRateLimiter', () => {
    const app = buildApp();

    it('permite hasta 10 intentos para la misma cuenta y bloquea el siguiente', async () => {
        for (let i = 0; i < 10; i++) {
            const res = await request(app).post('/login').send({ email: 'victima@test.com', password: 'mal' });
            expect(res.status).toBe(200);
        }

        const bloqueado = await request(app).post('/login').send({ email: 'victima@test.com', password: 'mal' });
        expect(bloqueado.status).toBe(429);
    });

    it('no bloquea intentos contra una cuenta distinta', async () => {
        const res = await request(app).post('/login').send({ email: 'otra-cuenta@test.com', password: 'mal' });
        expect(res.status).toBe(200);
    });
});
