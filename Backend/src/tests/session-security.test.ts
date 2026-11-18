import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import type { Server } from 'node:http';
import express from 'express';

// Exercise production headers without issuing any database queries.
process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'isolated-production-cookie-security-test-secret';
process.env.FRONTEND_URL = 'https://cinema.example';
process.env.CORS_ORIGIN = 'https://cinema.example';

describe('production cookie and browser request security', () => {
  let server: Server;
  let baseUrl: string;
  let closePool: () => Promise<void>;

  before(async () => {
    const { app } = await import('../app.js');
    const { pool } = await import('../db.js');
    closePool = () => pool.end();
    const { setSessionCookie, clearSessionCookie } = await import('../services/sessions.service.js');
    const wrapper = express();
    wrapper.get('/test-cookie', (_req, res) => {
      setSessionCookie(res, { token: 'test-session', expiresAt: Date.now() + 60_000 });
      res.end();
    });
    wrapper.get('/test-clear-cookie', (_req, res) => { clearSessionCookie(res); res.end(); });
    wrapper.use(app);
    server = await new Promise<Server>(resolveServer => {
      const listening = wrapper.listen(0, '127.0.0.1', () => resolveServer(listening));
    });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    baseUrl = `http://127.0.0.1:${address.port}`;
  });
  after(async () => {
    if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await closePool?.();
  });

  test('production cookies are host-only, HttpOnly, Secure and use the __Host prefix', async () => {
    const cookie = (await fetch(baseUrl + '/test-cookie')).headers.get('set-cookie')!;
    assert.match(cookie, /^__Host-filmvisarna_session=test-session;/);
    for (const attribute of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/']) assert.ok(cookie.includes(attribute));
    assert.doesNotMatch(cookie, /Domain=/i);
    const cleared = (await fetch(baseUrl + '/test-clear-cookie')).headers.get('set-cookie')!;
    assert.match(cleared, /^__Host-filmvisarna_session=;/);
    assert.match(cleared, /Expires=Thu, 01 Jan 1970/);
    for (const attribute of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/']) assert.ok(cleared.includes(attribute));
  });

  test('CORS preflight permits credentials and the CSRF header only for configured origins', async () => {
    for (const origin of ['https://cinema.example', 'https://evil.example', 'null']) {
      const response = await fetch(baseUrl + '/api/auth/login', { method: 'OPTIONS', headers: {
        Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'X-CSRF-Protection,Content-Type',
      } });
      assert.equal(response.status, 204);
      assert.equal(response.headers.get('access-control-allow-origin'), origin === 'https://cinema.example' ? origin : null);
      if (origin === 'https://cinema.example') {
        assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
        assert.match(response.headers.get('access-control-allow-headers')!, /X-CSRF-Protection/i);
      }
    }
  });

  test('all API mutation methods reject missing CSRF headers and untrusted origins before routing', async () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      const rejectedHeaders: Record<string, string>[] = [ {}, { Origin: 'https://cinema.example' },
        { 'X-CSRF-Protection': '1', Origin: 'https://evil.example' },
        { 'X-CSRF-Protection': '1', Origin: 'https://sub.cinema.example' },
        { 'X-CSRF-Protection': '1', Origin: 'null' } ];
      for (const headers of rejectedHeaders) {
        assert.equal((await fetch(baseUrl + '/api/health', { method, headers })).status, 403);
      }
      // Once validated, this nonexistent write reaches routing (404) without accessing the DB.
      assert.equal((await fetch(baseUrl + '/api/health', { method,
        headers: { 'X-CSRF-Protection': '1', Origin: 'https://cinema.example' } })).status, 404);
      assert.equal((await fetch(baseUrl + '/api/health', { method,
        headers: { 'X-CSRF-Protection': '1' } })).status, 404);
    }
  });

  test('multipart form posts cannot bypass CSRF and safe health requests remain public', async () => {
    const body = new FormData();
    body.set('message', 'forged form');
    assert.equal((await fetch(baseUrl + '/api/contact', { method: 'POST', body })).status, 403);
    assert.equal((await fetch(baseUrl + '/api/health')).status, 200);
    assert.equal((await fetch(baseUrl + '/api/health', { method: 'HEAD' })).status, 200);
  });
});
