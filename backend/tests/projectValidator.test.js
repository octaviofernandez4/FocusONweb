const express = require('express');
const request = require('supertest');
const { validarProyecto } = require('../src/validators/projectValidator');

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.post('/projects', validarProyecto, (req, res) => res.status(200).json({ ok: true }));
    return app;
};

describe('validarProyecto', () => {
    const app = buildApp();

    it('rejects a request with no name', async () => {
        const res = await request(app).post('/projects').send({});

        expect(res.status).toBe(400);
    });

    it('accepts a request with only a name', async () => {
        const res = await request(app).post('/projects').send({ name: 'Diseño' });

        expect(res.status).toBe(200);
    });

    it('accepts a request with name and color', async () => {
        const res = await request(app).post('/projects').send({ name: 'Diseño', color: 'pink' });

        expect(res.status).toBe(200);
    });
});
