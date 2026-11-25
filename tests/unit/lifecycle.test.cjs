'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const { createLifecycle } = require('../../server/services/deploymentLifecycle');
const JobExecutor = require('../../runner-agent/jobExecutor');
const { PortManagementService } = require('../../server/services/portManagementService');
const { validateGitSignature } = require('../../server/utils/webhookManager');

// Controlled persistence for unit-level race scheduling. Real MongoDB cases live
// in server/tests/lifecycle.test.js and are reported independently.
function records(status = 'building') {
  let record = { _id: 'a'.repeat(24), status, lifecycleVersion: 0, workerClaimedAt: new Date(), logs: [] };
  const model = {
    findById: async () => structuredClone(record),
    async findOneAndUpdate(query, update) {
      if (record.status !== query.status || (query.lifecycleVersion !== undefined && record.lifecycleVersion !== query.lifecycleVersion) || (query.$or && record.lifecycleVersion !== 0)) return null;
      Object.assign(record, update.$set); record.lifecycleVersion++;
      record.logs.push(...update.$push.logs.$each);
      return structuredClone(record);
    },
  };
  return { service: createLifecycle(model), read: () => record };
}

test('cancellation and promotion cannot both win the same deployment revision', async () => {
  const { service, read } = records('deploying');
  const results = await Promise.allSettled([service.transition('id', 'cancelled'), service.transition('id', 'running')]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.find(result => result.status === 'rejected').reason.status, 409);
  assert.equal(read().status, 'cancelled');
  assert.equal(read().cleanupStatus, 'pending');
});
test('terminal callbacks cannot resurrect a cancelled deployment or replace its metadata', async () => {
  const { service, read } = records('cancelled');
  await assert.rejects(service.transition('id', 'running'), { status: 409 });
  await service.transition('id', 'cancelled', { productionUrl: 'https://untrusted.test' });
  assert.equal(read().productionUrl, undefined);
});
test('lifecycle updates cannot rewrite ownership, claimed worker or status through extra fields', async () => {
  const { service, read } = records();
  await service.transition('id', 'deploying', { status: 'running', projectId: 'attacker', workerNodeId: 'attacker', buildTime: 4 });
  assert.equal(read().status, 'deploying'); assert.equal(read().projectId, undefined);
  assert.equal(read().workerNodeId, undefined); assert.equal(read().buildTime, 4);
  assert.equal(read().logs.length, 1);
});
test('a committed success with a lost HTTP response preserves the running application', async () => {
  const worker = new JobExecutor('worker-a', 'http://localhost');
  worker.updateStatus = async () => { throw new Error('Response connection reset'); };
  worker.client.get = async () => ({ status: 200, data: { status: 'running', workerNodeId: 'worker-a' } });
  await worker.publishRunning('id', {});
});
test('an unknown final acknowledgement requires reconciliation rather than destructive cleanup', async () => {
  const worker = new JobExecutor('worker-a', 'http://localhost');
  worker.updateStatus = async () => { throw new Error('Response connection reset'); };
  worker.client.get = async () => { throw new Error('Control plane unavailable'); };
  await assert.rejects(worker.publishRunning('id', {}), error => error.reconciliationRequired === true);
});
test('a confirmed cancelled state after rejected promotion does not become successful', async () => {
  const worker = new JobExecutor('worker-a', 'http://localhost');
  worker.updateStatus = async () => { throw new Error('Callback rejected'); };
  worker.client.get = async () => ({ status: 200, data: { status: 'cancelled' } });
  await assert.rejects(worker.publishRunning('id', {}), /Callback rejected/);
});
test('runtime removal distinguishes absent containers from an unavailable Docker daemon', async () => {
  const worker = new JobExecutor('worker-a', 'http://localhost');
  worker.exec = async () => { throw new Error('docker rm exited 1: No such container: test'); };
  await worker.removeRuntime('test');
  worker.exec = async () => { throw new Error('Cannot connect to the Docker daemon'); };
  await assert.rejects(worker.removeRuntime('test'), /Docker daemon/);
});
test('port reservations retry unique-index collisions from another API instance', async () => {
  let created = 0;
  const mappings = { findOne: async () => null, findOneAndUpdate: async () => null, create: async data => { if (++created === 1) throw Object.assign(new Error('duplicate port'), { code: 11000 }); return data; } };
  const ports = new PortManagementService(mappings); ports.portRangeStart = 4100; ports.portRangeEnd = 4101;
  const result = await ports.allocatePort('id', { nodeId: 'worker-a' });
  assert.equal(result.containerPort, 4101); assert.equal(created, 2);
});
test('a reservation cannot be borrowed by a different worker', async () => {
  const ports = new PortManagementService({ findOne: async () => ({ nodeId: 'worker-b', containerPort: 4100 }) });
  await assert.rejects(ports.allocatePort('id', { nodeId: 'worker-a' }), /another worker/);
});
test('port exhaustion is a real failure, with no random port fallback', async () => {
  const ports = new PortManagementService({ findOne: async () => null, findOneAndUpdate: async () => null, create: async () => { throw Object.assign(new Error('busy'), { code: 11000 }); } });
  ports.portRangeStart = ports.portRangeEnd = 4100;
  await assert.rejects(ports.allocatePort('id', { nodeId: 'worker-a' }), /No available ports/);
});
test('GitHub webhook HMAC covers exact raw bytes including whitespace', () => {
  const original = process.env.GITHUB_WEBHOOK_SECRET;
  process.env.GITHUB_WEBHOOK_SECRET = 'unit-only-webhook-fixture';
  try {
    const payload = Buffer.from('{ "message": "hello" }\n');
    const signature = 'sha256=' + createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET).update(payload).digest('hex');
    assert.equal(validateGitSignature('github', payload, signature), true);
    assert.equal(validateGitSignature('github', Buffer.from('{"message":"hello"}'), signature), false);
    assert.equal(validateGitSignature('github', payload, undefined), false);
    assert.equal(validateGitSignature('github', payload, 'short'), false);
    assert.equal(validateGitSignature('github', JSON.parse(payload), signature), false);
  } finally { if (original === undefined) delete process.env.GITHUB_WEBHOOK_SECRET; else process.env.GITHUB_WEBHOOK_SECRET = original; }
});
