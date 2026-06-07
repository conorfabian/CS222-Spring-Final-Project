import assert from 'node:assert/strict';
import test from 'node:test';

import { getApiBaseCandidatesForEnvironment } from './apiBaseCandidates.js';

test('local dev prefers same-origin api route before direct localhost fallbacks', () => {
  const candidates = getApiBaseCandidatesForEnvironment({
    hostname: '127.0.0.1',
    isDev: true
  });

  assert.equal(candidates[0], '');
  assert.deepEqual(candidates.slice(1), [
    'http://127.0.0.1:8787',
    'http://localhost:8787'
  ]);
});

test('non-local production-like environment does not inject localhost fallbacks', () => {
  const candidates = getApiBaseCandidatesForEnvironment({
    hostname: 'example.com',
    isDev: false
  });

  assert.deepEqual(candidates, ['']);
});
