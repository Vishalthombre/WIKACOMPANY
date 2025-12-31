const express = require('express');
const router = express.Router();
const safetyController = require('../controllers/safetyController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- MULTER CONFIG (For Image Upload) ---
const uploadDir = 'uploads/safety';

// Create folder if it doesn't exist
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Save to 'uploads/safety'
    },
    filename: (req, file, cb) => {
        // Filename: FieldName + Date + Extension
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- ROUTES ---

// 1. Get Dropdowns
router.get('/master-data', safetyController.getMasterData);

// 2. Create Ticket (Handles 'safetyImage' file upload)
router.post('/tickets', upload.single('safetyImage'), safetyController.createTicket);

// 3. Get All Tickets
router.get('/tickets', safetyController.getAllTickets);

// 4. Get Technicians
router.get('/technicians', safetyController.getTechnicians);

// 5. Assign Ticket
router.post('/assign', safetyController.assignTicket);

// 6. Update Status
router.post('/update-status', safetyController.updateStatus);

router.delete('/tickets/:id', safetyController.deleteTicket);

module.exports = router;