import request from 'supertest';
import app from '../../src/app';

describe('Health', () => {
  it('GET / should return OK message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/DeKingsPalace API Running/);
  });
});


