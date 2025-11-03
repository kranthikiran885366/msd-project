const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const ssoController = require('../controllers/ssoController');

// SSO Configuration
router.get('/:organizationId', 
  authenticate, 
  requirePermission('sso:read'), 
  ssoController.getConfig
);

router.post('/:organizationId', 
  authenticate, 
  requirePermission('sso:manage'), 
  ssoController.createConfig
);

router.put('/:organizationId', 
  authenticate, 
  requirePermission('sso:manage'), 
  ssoController.updateConfig
);

router.delete('/:organizationId', 
  authenticate, 
  requirePermission('sso:manage'), 
  ssoController.deleteConfig
);

// SSO Management
router.post('/:organizationId/toggle', 
  authenticate, 
  requirePermission('sso:manage'), 
  ssoController.toggleSSO
);

router.post('/:organizationId/test', 
  authenticate, 
  requirePermission('sso:manage'), 
  ssoController.testConnection
);

module.exports = router;