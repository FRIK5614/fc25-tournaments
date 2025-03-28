// tests/tournaments.test.js
const request = require('supertest');
const app = require('../app');

jest.setTimeout(30000);

describe('Tournament full flow', () => {
  const tokens = [];
  let tournamentId;

  it('Registers and logs in 4 users', async () => {
    for (let i = 1; i <= 4; i++) {
      const email = `user${i}@test.com`;
      await request(app)
        .post('/auth/register')
        .send({
          username: `user${i}`,
          email,
          phone: '+71234567890',
          country: 'Russia',
          platform: 'PC',
          gamertag: `user${i}`,
          password: 'Password123!'
        });

      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email, password: 'Password123!' });
      expect(loginRes.statusCode).toBe(200);
      tokens.push(loginRes.body.token);
    }
  });

  it('Creates tournament via quick-find', async () => {
    for (const token of tokens) {
      const res = await request(app)
        .post('/tournaments/find')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 201]).toContain(res.statusCode);
      if (res.statusCode === 201) tournamentId = res.body.tournament._id;
    }
    expect(tournamentId).toBeDefined();
  });

  it('Fetches tournament details', async () => {
    const res = await request(app)
      .get(`/tournaments/${tournamentId}`)
      .set('Authorization', `Bearer ${tokens[0]}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.matches.length).toBe(6);
  });

  it('Returns initial standings with zero points', async () => {
    const res = await request(app)
      .get(`/tournaments/${tournamentId}/standings`)
      .set('Authorization', `Bearer ${tokens[0]}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(4);
    res.body.forEach(row => {
      expect(row.points).toBe(0);
      expect(row.goalDifference).toBe(0);
    });
  });
});
