'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Deployment = require('../../server/models/Deployment');
const service = require('../../server/services/deploymentService');
test('configured deployment branch takes precedence over repository default', async () => {
  const original = service.fetchGitHubDefaultBranch;
  service.fetchGitHubDefaultBranch = async () => assert.fail('Must not replace the configured branch');
  try { assert.equal(await service.resolveDeploymentBranch({ repository: { provider: 'github', owner: 'owner', name: 'repo', branch: 'release' } }), 'release'); }
  finally { service.fetchGitHubDefaultBranch = original; }
});
test('previous-commit rebuild stays in the same environment and records the caller', async () => {
  const originals = [Deployment.findById, Deployment.findOne, service.createDeployment];
  const deployment = { _id: 'a'.repeat(24), projectId: 'b'.repeat(24), environment: 'staging', createdAt: new Date(), deployedBy: 'old-actor' };
  let filter, request;
  Deployment.findById = async () => deployment;
  Deployment.findOne = query => { filter = query; return { sort: async () => ({ gitCommit: 'c'.repeat(40), gitBranch: 'release' }) }; };
  service.createDeployment = async options => { request = options; return options; };
  try {
    await service.rollbackDeployment(deployment._id, 'Regression', 'current-owner');
    assert.equal(filter.environment, 'staging'); assert.equal(request.environment, 'staging');
    assert.equal(request.gitCommit, 'c'.repeat(40)); assert.equal(request.userId, 'current-owner');
  } finally { [Deployment.findById, Deployment.findOne, service.createDeployment] = originals; }
});
test('previous deployment without a full commit cannot silently rebuild branch HEAD', async () => {
  const originals = [Deployment.findById, Deployment.findOne];
  Deployment.findById = async () => ({ _id: 'a'.repeat(24), projectId: 'b'.repeat(24), environment: 'production', createdAt: new Date() });
  Deployment.findOne = () => ({ sort: async () => ({ gitCommit: null }) });
  try { await assert.rejects(service.rollbackDeployment('a'.repeat(24)), { status: 409 }); }
  finally { [Deployment.findById, Deployment.findOne] = originals; }
});
