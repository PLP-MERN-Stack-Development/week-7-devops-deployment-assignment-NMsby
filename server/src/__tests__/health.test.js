import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';

describe('Health Endpoints', () => {
    let server;

    beforeAll(() => {
        server = app.listen(0); // Use random port for testing
    });

    afterAll((done) => {
        server.close(done);
    });

    describe('GET /api/health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body).toMatchObject({
                status: expect.stringMatching(/healthy|unhealthy/),
                timestamp: expect.any(String),
                environment: expect.any(String),
                version: expect.any(String),
                uptime: expect.any(Object),
                memory: expect.any(Object),
                system: expect.any(Object)
            });
        });

        it('should include database status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body.database).toBeDefined();
            expect(response.body.database).toMatchObject({
                status: expect.any(String),
                connected: expect.any(Boolean)
            });
        });
    });

    describe('GET /api', () => {
        it('should return API information', async () => {
            const response = await request(app)
                .get('/api')
                .expect(200);

            expect(response.body).toMatchObject({
                message: 'MERN Stack API is running!',
                version: expect.any(String),
                environment: expect.any(String),
                database: expect.any(String),
                timestamp: expect.any(String)
            });
        });
    });

    describe('Error handling', () => {
        it('should return 404 for non-existent routes', async () => {
            const response = await request(app)
                .get('/api/non-existent')
                .expect(404);

            expect(response.body).toMatchObject({
                error: {
                    message: 'Route not found',
                    path: '/api/non-existent',
                    method: 'GET',
                    timestamp: expect.any(String),
                    requestId: expect.any(String)
                }
            });
        });

        if (process.env.NODE_ENV === 'development') {
            it('should handle test error endpoint', async () => {
                const response = await request(app)
                    .get('/api/test-error')
                    .expect(500);

                expect(response.body).toMatchObject({
                    error: {
                        message: 'Test error for Sentry monitoring',
                        status: 500,
                        timestamp: expect.any(String),
                        requestId: expect.any(String)
                    }
                });
            });
        }
    });
});