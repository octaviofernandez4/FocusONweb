const express = require('express');
const request = require('supertest');
const { validarRegistro, validarLogin } = require('../src/validators/userValidator');

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.post('/register', validarRegistro, (req, res) => res.status(200).json({ body: req.body }));
    app.post('/login', validarLogin, (req, res) => res.status(200).json({ body: req.body }));
    return app;
};

describe('validarRegistro', () => {
    const app = buildApp();

    it('rejects missing fields', async () => {
        const res = await request(app).post('/register').send({});

        expect(res.status).toBe(400);
        const fields = res.body.errores.map((e) => e.path);
        expect(fields).toEqual(expect.arrayContaining(['name', 'lastname', 'email', 'password']));
    });

    it('rejects a short password', async () => {
        const res = await request(app).post('/register').send({
            name: 'Octavio',
            lastname: 'Fernandez',
            email: 'octavio@example.com',
            password: '123'
        });

        expect(res.status).toBe(400);
    });

    it('rejects an invalid email', async () => {
        const res = await request(app).post('/register').send({
            name: 'Octavio',
            lastname: 'Fernandez',
            email: 'no-es-un-email',
            password: '123456'
        });

        expect(res.status).toBe(400);
    });

    it('accepts a valid registration and normalizes the email to lowercase', async () => {
        const res = await request(app).post('/register').send({
            name: 'Octavio',
            lastname: 'Fernandez',
            email: 'Octavio@Example.COM',
            password: '123456'
        });

        expect(res.status).toBe(200);
        expect(res.body.body.email).toBe('octavio@example.com');
    });
});

describe('validarLogin', () => {
    const app = buildApp();

    it('rejects a missing password', async () => {
        const res = await request(app).post('/login').send({ email: 'octavio@example.com' });

        expect(res.status).toBe(400);
    });

    it('accepts valid credentials shape', async () => {
        const res = await request(app).post('/login').send({
            email: 'octavio@example.com',
            password: 'whatever'
        });

        expect(res.status).toBe(200);
    });
});
