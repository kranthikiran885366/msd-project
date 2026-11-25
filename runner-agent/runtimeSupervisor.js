'use strict';
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const JobExecutor = require('./jobExecutor');

// Private persistent worker journal. Claim tokens are credentials: never log or
// publish this directory. A production executor still requires a separate adapter.
class RuntimeSupervisor {
  constructor(nodeId, backendUrl, options = {}) {
    this.nodeId = nodeId;
    this.backendUrl = backendUrl;
    const nodeKey = crypto.createHash('sha256').update(nodeId).digest('hex');
    this.directory = path.join(options.directory || process.env.WORKER_STATE_DIR || '/var/lib/clouddeck-worker', nodeKey);
    this.executors = new Map();
    this.unhealthy = new Map();
    this.busy = false;
    this.makeExecutor = options.makeExecutor || (() => new JobExecutor(nodeId, backendUrl));
  }
  file(id) {
    if (!/^[a-f\d]{24}$/i.test(String(id))) throw new Error('Invalid deployment journal identity');
    return path.join(this.directory, `${id}.json`);
  }
  async remember(id, token, executor) {
    const file = this.file(id);
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error('Invalid worker claim token');
    await fs.mkdir(this.directory, { recursive: true, mode: 0o700 });
    const temporary = `${file}.${crypto.randomBytes(8).toString('hex')}.tmp`;
    const handle = await fs.open(temporary, 'wx', 0o600);
    try { await handle.writeFile(JSON.stringify({ deploymentId: id, token })); await handle.sync(); }
    finally { await handle.close(); }
    await fs.rename(temporary, file);
    const directoryHandle = await fs.open(this.directory, 'r');
    try { await directoryHandle.sync(); } finally { await directoryHandle.close(); }
    this.executors.set(id, executor);
  }
  async recover() {
    await fs.mkdir(this.directory, { recursive: true, mode: 0o700 });
    for (const name of await fs.readdir(this.directory)) {
      if (!/^[a-f\d]{24}\.json$/i.test(name)) continue;
      const record = JSON.parse(await fs.readFile(path.join(this.directory, name), 'utf8'));
      if (this.file(record.deploymentId) !== path.join(this.directory, name) || !/^[A-Za-z0-9_-]{43}$/.test(record.token)) throw new Error('Corrupt worker journal; inspect privately before restarting');
      const executor = this.makeExecutor();
      executor.client.defaults.headers.common['x-clouddeck-claim'] = record.token;
      this.executors.set(record.deploymentId, executor);
    }
    // No interrupted build is replayed: its external effects must first be cleaned.
    await this.tick(true);
  }
  async tick(recovering = false) {
    if (this.busy) return;
    this.busy = true;
    try {
      for (const [id, executor] of this.executors) {
        try {
          const response = await executor.client.get(`/api/deployments/${id}/worker-state`, { timeout: 5000 });
          if (response.status !== 200 || response.data.workerNodeId !== this.nodeId) continue;
          let status = response.data.status;
          if (recovering && ['pending', 'building', 'deploying'].includes(status)) {
            await executor.updateStatus(id, 'failed', { error: 'Worker restarted during execution; automatic replay refused' });
            status = 'failed';
          }
          if (status === 'running' && !await executor.runtimeState(`msd-${id}`)) {
            await executor.updateStatus(id, 'failed', { error: 'Application container is no longer running' });
            status = 'failed';
          }
          if (status === 'running') {
            try { await executor.probeRuntime(response.data.runtimeUrl, response.data.healthCheckPath || '/'); this.unhealthy.delete(id); }
            catch {
              const count = (this.unhealthy.get(id) || 0) + 1; this.unhealthy.set(id, count);
              if (count >= 3) { await executor.updateStatus(id, 'failed', { error: 'Application failed three consecutive HTTP health checks' }); status = 'failed'; }
            }
          }
          if (!['failed', 'cancelled', 'rolled-back', 'stopped'].includes(status)) continue;
          await executor.removeRuntime(`msd-${id}`);
          await executor.removeImage(id);
          await executor.cleanup(path.join('/tmp/msd-builds', id));
          const acknowledgement = await executor.client.post(`/api/deployments/${id}/cleanup`, { status: 'complete' }, { timeout: 10000 });
          if (acknowledgement.status !== 200) throw new Error('Cleanup acknowledgement unavailable');
          await fs.rm(this.file(id), { force: true });
          this.executors.delete(id);
          this.unhealthy.delete(id);
        } catch (error) {
          // Keep the journal and port reservation until a later confirmed retry.
          console.error(`[supervisor] Deployment ${id} requires reconciliation: ${error.message}`);
        }
      }
    } finally { this.busy = false; }
  }
}
module.exports = RuntimeSupervisor;
