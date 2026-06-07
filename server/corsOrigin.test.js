import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCorsOriginValidator } from './corsOrigin.js';

function validate(validator, origin) {
  return new Promise((resolve, reject) => {
    validator(origin, (error, allowed) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(allowed);
    });
  });
}

test('cors validator accepts localhost dev origins regardless of configured port', async () => {
  const validator = buildCorsOriginValidator('http://127.0.0.1:5177');

  await assert.doesNotReject(() => validate(validator, 'http://127.0.0.1:5174'));
  await assert.doesNotReject(() => validate(validator, 'http://localhost:5179'));
});

test('cors validator rejects non-local origins not in the allow list', async () => {
  const validator = buildCorsOriginValidator('http://127.0.0.1:5177');

  await assert.rejects(() => validate(validator, 'https://evil.example.com'));
});
