'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Deployment = require('../../server/models/Deployment');
const { workerClaim, hashClaim } = require('../../server/middleware/workerClaim');
function response() { return { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
test('callbacks cannot borrow a different deployment claim token', async () => {
  const original = Deployment.findById;
  Deployment.findById = () => ({ select: async () => ({ workerClaimHash: hashClaim('right-claim') }) });
  try {
    const res = response();
    await workerClaim({ params: { id: 'a'.repeat(24) }, headers: { 'x-clouddeck-claim': 'other-claim' } }, res, () => assert.fail('Claim isolation bypass'));
    assert.equal(res.code, 403);
  } finally { Deployment.findById = original; }
});
test('correct claim binds the deployment to the callback request', async () => {
  const original = Deployment.findById;
  const record = { _id: 'a'.repeat(24), workerClaimHash: hashClaim('right-claim') };
  Deployment.findById = () => ({ select: async () => record });
  try {
    const req = { params: { id: record._id }, headers: { 'x-clouddeck-claim': 'right-claim' } }; let continued = false;
    await workerClaim(req, response(), () => { continued = true; });
    assert.equal(continued, true); assert.equal(req.workerDeployment, record);
  } finally { Deployment.findById = original; }
});
