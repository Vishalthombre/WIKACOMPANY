const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilityController');

// --- Standard Ticket Routes ---
router.get('/tickets', facilityController.getAllTickets);
router.get('/dropdowns', facilityController.getDropdownData);
router.get('/technicians', facilityController.getTechnicians);

router.post('/tickets', facilityController.createTicket);
router.post('/assign', facilityController.assignTicket);
router.post('/status', facilityController.updateStatus);
router.delete('/tickets/:id', facilityController.deleteTicket);

// --- NEW: Master Data Management Routes (Fixes 404) ---

// Buildings
router.post('/master/building', facilityController.addBuilding);
router.delete('/master/building/:id', facilityController.deleteBuilding);

// Areas
router.post('/master/area', facilityController.addArea);
router.delete('/master/area/:id', facilityController.deleteArea);

// SubAreas (Delete uses POST/DELETE body because we delete by name + parent ID)
router.post('/master/subarea', facilityController.addSubArea);
router.delete('/master/subarea', facilityController.deleteSubArea);

// Keywords
router.post('/master/keyword', facilityController.addKeyword);
router.delete('/master/keyword/:name', facilityController.deleteKeyword);

module.exports = router;