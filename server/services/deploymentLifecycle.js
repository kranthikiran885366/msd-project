'use strict';
const { canTransition } = require('./deploymentState');

const editable = new Set(['gitCommit', 'buildTime', 'deployTime', 'runtimeUrl', 'localUrl', 'previewUrl', 'stagingUrl', 'productionUrl', 'rollbackReason', 'provider', 'providerDeploymentId', 'providerMetadata', 'artifact']);
const conflict = message => Object.assign(new Error(message), { status: 409 });

// One compare-and-swap implementation for API actions and worker/provider callbacks.
// The status, revision and audit line commit in the same MongoDB update.
function createLifecycle(Deployment) {
  return {
    async transition(id, status, changes = {}) {
      const current = await Deployment.findById(id);
      if (!current) throw Object.assign(new Error('Deployment not found'), { status: 404 });
      if (!canTransition(current.status, status)) throw conflict('Invalid deployment state transition');
      if (current.status === status && ['failed', 'cancelled', 'rolled-back', 'stopped', 'running'].includes(status)) return current;
      const updates = {};
      for (const [key, value] of Object.entries(changes)) if (editable.has(key) && value !== undefined) updates[key] = value;
      updates.status = status;
      if (['failed', 'cancelled', 'rolled-back', 'stopped'].includes(status)) {
        updates.cleanupStatus = current.workerClaimedAt ? 'pending' : 'not-required';
        updates.cleanupRequestedAt = new Date();
      }
      const version = Number(current.lifecycleVersion || 0);
      const query = { _id: current._id, status: current.status };
      if (version === 0) query.$or = [{ lifecycleVersion: 0 }, { lifecycleVersion: { $exists: false } }];
      else query.lifecycleVersion = version;
      const changed = await Deployment.findOneAndUpdate(query, {
        $set: updates, $inc: { lifecycleVersion: 1 },
        $push: { logs: { $each: [{ timestamp: new Date(), level: 'info', message: `Deployment status changed to: ${status}` }], $slice: -2000 } },
      }, { new: true, runValidators: true });
      if (!changed) throw conflict('Deployment changed concurrently; reload before retrying');
      return changed;
    },
  };
}

module.exports = { createLifecycle };
