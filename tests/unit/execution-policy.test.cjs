'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { assertDevelopmentExecutor } = require('../../runner-agent/executionPolicy');

test('shared host Docker cannot be enabled for production, including with legacy override flags', () => {
  for (const extra of [{}, { ALLOW_UNTRUSTED_BUILDS: 'true' }, { DEPLOYMENT_STRATEGY: 'internal' }]) {
    assert.throws(() => assertDevelopmentExecutor({ NODE_ENV: 'production', ...extra }), /disabled in production/);
  }
  assert.doesNotThrow(() => assertDevelopmentExecutor({ NODE_ENV: 'development' }));
});
