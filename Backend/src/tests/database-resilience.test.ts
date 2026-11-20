import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { pool } from '../db.js';

after(async () => { await pool.end(); });

test('an idle database disconnect is handled without crashing or logging credentials', () => {
  const original = console.error;
  const messages: unknown[][] = [];
  console.error = (...args: unknown[]) => { messages.push(args); };
  try {
    const error = Object.assign(new Error('Sensitive connection details must not appear'), { code: 'ECONNRESET' });
    assert.doesNotThrow(() => pool.emit('error', error));
    assert.equal(messages.length, 1);
    assert.match(JSON.stringify(messages), /ECONNRESET/);
    assert.doesNotMatch(JSON.stringify(messages), /Sensitive connection details/);
  } finally { console.error = original; }
});
