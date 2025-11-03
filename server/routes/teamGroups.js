const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const teamGroupController = require('../controllers/teamGroupController');

// Team Groups
router.post('/', 
  authenticate, 
  requirePermission('team:manage_groups'), 
  teamGroupController.createGroup
);

router.get('/:groupId', 
  authenticate, 
  teamGroupController.getGroup
);

router.get('/team/:teamId', 
  authenticate, 
  teamGroupController.listGroups
);

router.put('/:groupId', 
  authenticate, 
  requirePermission('team:manage_groups'), 
  teamGroupController.updateGroup
);

router.delete('/:groupId', 
  authenticate, 
  requirePermission('team:manage_groups'), 
  teamGroupController.deleteGroup
);

// Group Members
router.post('/:groupId/members', 
  authenticate, 
  requirePermission('team:manage_groups'), 
  teamGroupController.addMembers
);

router.delete('/:groupId/members', 
  authenticate, 
  requirePermission('team:manage_groups'), 
  teamGroupController.removeMembers
);

// Group Permissions
router.put('/:groupId/permissions', 
  authenticate, 
  requirePermission('team:manage_groups'), 
  teamGroupController.updatePermissions
);

module.exports = router;