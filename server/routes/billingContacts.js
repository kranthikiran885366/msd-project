const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const billingContactController = require('../controllers/billingContactController');

// Billing Contacts
router.post('/:organizationId', 
  authenticate, 
  requirePermission('billing:manage'), 
  billingContactController.createContact
);

router.get('/:organizationId', 
  authenticate, 
  requirePermission('billing:read'), 
  billingContactController.listContacts
);

router.get('/:organizationId/:contactId', 
  authenticate, 
  requirePermission('billing:read'), 
  billingContactController.getContact
);

router.put('/:organizationId/:contactId', 
  authenticate, 
  requirePermission('billing:manage'), 
  billingContactController.updateContact
);

router.delete('/:organizationId/:contactId', 
  authenticate, 
  requirePermission('billing:manage'), 
  billingContactController.deleteContact
);

// Contact Management
router.post('/:organizationId/:contactId/primary', 
  authenticate, 
  requirePermission('billing:manage'), 
  billingContactController.setPrimaryContact
);

router.put('/:organizationId/:contactId/preferences', 
  authenticate, 
  requirePermission('billing:manage'), 
  billingContactController.updatePreferences
);

module.exports = router;