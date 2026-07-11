process.env.JWT_SECRET = 'test-secret';

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middlewares/authMiddleware');

const buildApp = () => {
    const app = express();
    app.get('/protected', authMiddleware, (req, res) => res.status(200).json({ user: req.user }));
    return app;
};

describe('authMiddleware', () => {
    const app = buildApp();

    it('rejects a request with no Authorization header', async () => {
        const res = await request(app).get('/protected');

        expect(res.status).toBe(401);
    });

    it('rejects a request with an invalid token', async () => {
        const res = await request(app).get('/protected').set('Authorization', 'Bearer not-a-real-token');

        expect(res.status).toBe(401);
    });

    it('rejects an expired token', async () => {
        const expiredToken = jwt.sign({ id: 'abc123' }, process.env.JWT_SECRET, { expiresIn: -10 });

        const res = await request(app).get('/protected').set('Authorization', `Bearer ${expiredToken}`);

        expect(res.status).toBe(401);
    });

    it('allows a request with a valid token and exposes the decoded user', async () => {
        const token = jwt.sign({ id: 'abc123' }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.user.id).toBe('abc123');
    });
});
