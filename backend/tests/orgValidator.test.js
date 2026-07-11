const express = require('express');
const request = require('supertest');
const { validarOrganizacion } = require('../src/validators/orgValidator');

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.put('/orgs/me', validarOrganizacion, (req, res) => res.status(200).json({ ok: true }));
    return app;
};

describe('validarOrganizacion', () => {
    const app = buildApp();

    it('rejects a request with no name', async () => {
        const res = await request(app).put('/orgs/me').send({});

        expect(res.status).toBe(400);
        expect(res.body.errores[0].path).toBe('name');
    });

    it('accepts a request with a name', async () => {
        const res = await request(app).put('/orgs/me').send({ name: 'Mi Empresa' });

        expect(res.status).toBe(200);
    });
});
