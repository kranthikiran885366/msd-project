'use strict';
const { createHash, timingSafeEqual } = require('crypto');
const Deployment = require('../models/Deployment');
const hashClaim = token => createHash('sha256').update(token).digest('hex');
async function workerClaim(req, res, next) {
  try {
    const id = req.params.id || req.params.deploymentId || req.body?.deploymentId;
    if (!/^[a-f\d]{24}$/i.test(String(id || ''))) return res.status(404).json({ error: 'Deployment not found' });
    const token = req.headers['x-clouddeck-claim'];
    if (typeof token !== 'string' || token.length > 256) return res.status(403).json({ error: 'Worker claim required' });
    const deployment = await Deployment.findById(id).select('+workerClaimHash');
    const actual = hashClaim(token);
    if (!deployment?.workerClaimHash || deployment.workerClaimHash.length !== actual.length || !timingSafeEqual(Buffer.from(actual), Buffer.from(deployment.workerClaimHash))) return res.status(403).json({ error: 'Worker claim refused' });
    req.workerDeployment = deployment;
    next();
  } catch (error) { next(error); }
}
module.exports = { workerClaim, hashClaim };
