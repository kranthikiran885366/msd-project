'use strict';

// This executor controls a shared host daemon. It is deliberately limited to
// operator-owned repositories; a flag must never turn it into a tenant sandbox.
function assertDevelopmentExecutor(environment = process.env) {
  if (environment.NODE_ENV === 'production') {
    throw new Error('Shared-Docker execution is disabled in production. Install and validate an isolated build/runtime adapter before onboarding customers.');
  }
}

module.exports = { assertDevelopmentExecutor };
