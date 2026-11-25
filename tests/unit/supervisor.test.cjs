'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const RuntimeSupervisor = require('../../runner-agent/runtimeSupervisor');

async function fixture(run) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'clouddeck-journal-'));
  let status = 'running', remove = 0, acknowledgements = 0, acknowledgementFails = false, stateFails = false;
  const executor = {
    client: { defaults: { headers: { common: {} } },
      get: async () => ({ status: 200, data: { status, workerNodeId: 'node-a', runtimeUrl: 'http://localhost:4100' } }),
      post: async () => { acknowledgements++; return { status: acknowledgementFails ? 503 : 200 }; },
    },
    runtimeState: async () => { if (stateFails) throw new Error('Docker daemon unavailable'); return true; },
    probeRuntime: async () => {},
    removeRuntime: async () => { remove++; }, removeImage: async () => {}, cleanup: async () => {},
    updateStatus: async (id, next) => { status = next; },
  };
  const supervisor = new RuntimeSupervisor('node-a', 'http://localhost', { directory, makeExecutor: () => executor });
  const id = 'c'.repeat(24), token = 'x'.repeat(43);
  const state = { supervisor, executor, id, token, setStatus: value => { status = value; }, setAckFailure: value => { acknowledgementFails = value; }, setStateFailure: value => { stateFails = value; }, get removals() { return remove; }, get acknowledgements() { return acknowledgements; } };
  try { await run(state); } finally { await fs.rm(directory, { recursive: true, force: true }); }
}
test('claim journals survive restart with private permissions and reject path traversal', async () => fixture(async ({ supervisor, executor, id, token }) => {
  await supervisor.remember(id, token, executor);
  assert.equal((await fs.stat(supervisor.file(id))).mode & 0o777, 0o600);
  supervisor.executors.clear(); await supervisor.recover();
  assert.equal(supervisor.executors.has(id), true);
  assert.equal(executor.client.defaults.headers.common['x-clouddeck-claim'], token);
  assert.throws(() => supervisor.file('../escape'), /Invalid deployment/);
}));
test('stopped runtime cleanup removes the journal only after acknowledgement', async () => fixture(async state => {
  await state.supervisor.remember(state.id, state.token, state.executor); state.setStatus('stopped');
  await state.supervisor.tick();
  assert.equal(state.removals, 1); assert.equal(state.acknowledgements, 1);
  assert.equal(state.supervisor.executors.size, 0);
  await assert.rejects(fs.access(state.supervisor.file(state.id)));
}));
test('failed cleanup acknowledgement retains a durable retry record', async () => fixture(async state => {
  await state.supervisor.remember(state.id, state.token, state.executor); state.setStatus('cancelled'); state.setAckFailure(true);
  await state.supervisor.tick(); await fs.access(state.supervisor.file(state.id));
  assert.equal(state.supervisor.executors.size, 1);
  state.setAckFailure(false); await state.supervisor.tick();
  assert.equal(state.supervisor.executors.size, 0);
}));
test('unknown Docker state preserves healthy app and reservation for reconciliation', async () => fixture(async state => {
  await state.supervisor.remember(state.id, state.token, state.executor); state.setStateFailure(true);
  await state.supervisor.tick();
  assert.equal(state.removals, 0); assert.equal(state.acknowledgements, 0);
  await fs.access(state.supervisor.file(state.id));
}));
test('worker restart fails interrupted work without automatically replaying it', async () => fixture(async state => {
  await state.supervisor.remember(state.id, state.token, state.executor); state.setStatus('building');
  state.supervisor.executors.clear(); await state.supervisor.recover();
  assert.equal(state.removals, 1); assert.equal(state.supervisor.executors.size, 0);
}));
test('HTTP health requires three consecutive failures before withdrawal and cleanup', async () => fixture(async state => {
  await state.supervisor.remember(state.id, state.token, state.executor);
  state.executor.probeRuntime = async () => { throw new Error('HTTP 503'); };
  await state.supervisor.tick(); await state.supervisor.tick(); assert.equal(state.removals, 0);
  await state.supervisor.tick(); assert.equal(state.removals, 1);
}));
