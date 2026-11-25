process.env.NODE_ENV = 'test';
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Deployment = require('../models/Deployment');
const PortMapping = require('../models/PortMapping');
const { createLifecycle } = require('../services/deploymentLifecycle');
const { PortManagementService } = require('../services/portManagementService');
let mongo;
beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); await Promise.all([Deployment.init(), PortMapping.init()]); }, 60000);
afterAll(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });
test('MongoDB compare-and-swap prevents cancellation/promotion race', async () => {
  const deployment = await Deployment.create({ projectId: new mongoose.Types.ObjectId(), status: 'deploying', workerClaimedAt: new Date() });
  const lifecycle = createLifecycle(Deployment);
  const outcomes = await Promise.allSettled([lifecycle.transition(deployment._id, 'cancelled'), lifecycle.transition(deployment._id, 'running')]);
  expect(outcomes.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  expect((await Deployment.findById(deployment._id)).lifecycleVersion).toBe(1);
});
test('concurrent API instances reserve distinct ports and release makes one reusable', async () => {
  const first = new PortManagementService(), second = new PortManagementService();
  for (const service of [first, second]) { service.portRangeStart = 4200; service.portRangeEnd = 4201; }
  const ids = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
  const allocated = await Promise.all(ids.slice(0, 2).map((id, index) => [first, second][index].allocatePort(id, { nodeId: 'test-worker' })));
  expect(new Set(allocated.map(mapping => mapping.containerPort)).size).toBe(2);
  await expect(first.allocatePort(ids[2], { nodeId: 'test-worker' })).rejects.toThrow('No available ports');
  await first.releasePort(ids[0]);
  expect((await second.allocatePort(ids[2], { nodeId: 'test-worker' })).containerPort).toBe(allocated[0].containerPort);
});
test('webhook trigger identity is unique per project while manual deployments remain repeatable', async () => {
  const projectId = new mongoose.Types.ObjectId();
  await Deployment.create({ projectId, triggerKey: 'github-push:main:commit' });
  await expect(Deployment.create({ projectId, triggerKey: 'github-push:main:commit' })).rejects.toMatchObject({ code: 11000 });
  await Deployment.create({ projectId }); await Deployment.create({ projectId });
});
