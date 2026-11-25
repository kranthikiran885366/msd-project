'use strict';
const Project = require('../models/Project');
const Deployment = require('../models/Deployment');
const validId = value => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

async function ownedProject(id, userId) {
  if (!validId(String(id || '')) || !userId) return false;
  return Boolean(await Project.exists({ _id: id, userId }));
}

// Return the same response for missing resources and another tenant's resources.
function authorizeResource(kind) {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || (kind === 'project' ? req.params.id : null) || req.body?.projectId;
      if (projectId && !await ownedProject(projectId, req.userId)) {
        return res.status(404).json({ error: 'Project not found' });
      }
      const deploymentId = req.params.id || req.body?.deploymentId;
      if (kind === 'deployment' && deploymentId) {
        if (!validId(deploymentId)) return res.status(404).json({ error: 'Deployment not found' });
        const deployment = await Deployment.findById(deploymentId).select('projectId').lean();
        if (!deployment || !await ownedProject(deployment.projectId, req.userId)) {
          return res.status(404).json({ error: 'Deployment not found' });
        }
      }
      next();
    } catch (error) { next(error); }
  };
}
module.exports = { ownedProject, authorizeProject: authorizeResource('project'), authorizeDeployment: authorizeResource('deployment') };
