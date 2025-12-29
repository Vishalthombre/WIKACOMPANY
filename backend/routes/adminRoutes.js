const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Define Routes

// Get All Employees (Filtered by Admin's Location)
router.get('/employees', adminController.getEmployees);

// Add New Employee (Single User Onboarding)
router.post('/employees', adminController.addEmployee);

// Update Access Matrix (Roles & Departments)
router.post('/access', adminController.updateAccess);

module.exports = router;