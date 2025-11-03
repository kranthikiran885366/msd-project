const express = require('express');
const router = express.Router();
const mediaCDNController = require('../controllers/mediaCDNController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { authenticate } = require('../middleware/auth');

// List all assets
router.get('/assets', authenticate, mediaCDNController.listAssets);

// Upload new asset
router.post('/upload', authenticate, upload.single('file'), mediaCDNController.uploadAsset);

// Optimize asset
router.post('/assets/:id/optimize', authenticate, mediaCDNController.optimizeAsset);

// Purge asset cache
router.post('/assets/:id/purge', authenticate, mediaCDNController.purgeCache);

// Delete asset
router.delete('/assets/:id', authenticate, mediaCDNController.deleteAsset);

module.exports = router;