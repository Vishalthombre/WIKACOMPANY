const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route for Login (POST)
router.post('/login', authController.login);

// Route for Account Activation (Setting Password)
// This is NEW and required for the "Activate Account" flow
router.post('/activate', authController.activateAccount);

router.post('/verify', authController.verifyUser);

// Route for Permissions (GET)
// Example usage: GET /api/auth/permissions/G001
router.get('/permissions/:id', authController.getPermissions);

module.exports = router; 