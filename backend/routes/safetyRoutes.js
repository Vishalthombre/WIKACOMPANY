const express = require('express');
const router = express.Router();
const safetyController = require('../controllers/safetyController');
const multer = require('multer');

// --- MULTER CONFIG (Memory Storage) ---
// We use memoryStorage() so the file data is available in req.file.buffer
// inside the controller. This allows us to convert it to a Base64 string.
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit upload to 5MB to protect the DB
});

// --- ROUTES ---

// 1. Get Dropdowns
router.get('/master-data', safetyController.getMasterData);

// 2. Create Ticket (Handles 'safetyImage' file upload into memory)
router.post('/tickets', upload.single('safetyImage'), safetyController.createTicket);

// 3. Get All Tickets
router.get('/tickets', safetyController.getAllTickets);

// 4. Get Technicians
router.get('/technicians', safetyController.getTechnicians);

// 5. Assign Ticket
router.post('/assign', safetyController.assignTicket);

// 6. Update Status
router.post('/update-status', safetyController.updateStatus);

// 7. Delete Ticket
router.delete('/tickets/:id', safetyController.deleteTicket);

module.exports = router;