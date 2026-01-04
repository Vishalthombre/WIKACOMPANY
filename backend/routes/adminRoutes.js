const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Define Routes

// Get All Employees (Filtered by Admin's Location)
router.get('/employees', adminController.getEmployees);

// Add New Employee (Single User Onboarding)
router.get('/job-master-data', adminController.getJobMasterData);
router.post('/employees', adminController.addEmployee);

// Update Access Matrix (Roles & Departments)
router.post('/access', adminController.updateAccess);

router.post('/master', adminController.manageJobMaster); // Add/Delete Dept/Desig
router.get('/rules', adminController.getAccessRules);
router.post('/rules', adminController.addAccessRule);
router.delete('/rules/:ruleId', adminController.deleteAccessRule);

module.exports = router;