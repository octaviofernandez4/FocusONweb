const express = require('express');
const request = require('supertest');

jest.mock('../src/models/User');
const User = require('../src/models/User');
const orgMiddleware = require('../src/middlewares/orgMiddleware');

const buildApp = () => {
    const app = express();
    app.use((req, res, next) => {
        req.user = { id: 'user123' };
        next();
    });
    app.get('/protected', orgMiddleware, (req, res) => res.status(200).json({ orgId: req.orgId }));
    return app;
};

describe('orgMiddleware', () => {
    const app = buildApp();

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('rejects when the user has no currentOrg', async () => {
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ currentOrg: null }) });

        const res = await request(app).get('/protected');

        expect(res.status).toBe(409);
    });

    it('rejects when the user does not exist', async () => {
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

        const res = await request(app).get('/protected');

        expect(res.status).toBe(409);
    });

    it('attaches req.orgId when the user has a currentOrg', async () => {
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ currentOrg: 'org123' }) });

        const res = await request(app).get('/protected');

        expect(res.status).toBe(200);
        expect(res.body.orgId).toBe('org123');
    });
});
