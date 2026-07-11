const express = require('express');
const request = require('supertest');
const { validarTarea } = require('../src/validators/taskValidator');

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.post('/tasks', validarTarea, (req, res) => res.status(200).json({ ok: true }));
    return app;
};

describe('validarTarea', () => {
    const app = buildApp();

    it('rejects a request with no title', async () => {
        const res = await request(app).post('/tasks').send({ description: 'sin titulo' });

        expect(res.status).toBe(400);
        expect(res.body.errores[0].path).toBe('title');
    });

    it('rejects a request with an empty title', async () => {
        const res = await request(app).post('/tasks').send({ title: '' });

        expect(res.status).toBe(400);
    });

    it('accepts a request with only a title', async () => {
        const res = await request(app).post('/tasks').send({ title: 'Comprar pan' });

        expect(res.status).toBe(200);
    });

    it('accepts a request with title and description', async () => {
        const res = await request(app)
            .post('/tasks')
            .send({ title: 'Comprar pan', description: '  con miga  ' });

        expect(res.status).toBe(200);
    });
});
