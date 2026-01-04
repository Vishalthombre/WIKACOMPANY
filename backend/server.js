require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
// Import the DB connection promise to check connectivity
const { poolPromise } = require('./config/db');

const app = express();

// --- 1. Middleware ---
app.use(cors()); // Allows Frontend to talk to Backend

// Increase limit to 50MB to handle image uploads
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- 2. SERVE IMAGES (FAST & SMOOTH) ---
// We add 'maxAge' so the browser caches the image for 1 day (86400000 ms).
// This makes the UI feel instant when navigating between tabs.
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '1d', 
    etag: false
}));

// --- 3. Database Connection Check ---
poolPromise.then(() => {
    console.log('✅ Connected to MSSQL Database');
}).catch(err => {
    console.error('❌ Database Connection Failed:', err);
});

// --- 4. Import Routes ---
const authRoutes = require('./routes/authRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const safetyRoutes = require('./routes/safetyRoutes');

// --- 5. Mount Routes ---
app.use('/api/auth', authRoutes);       
app.use('/api/facility', facilityRoutes); 
app.use('/api/safety', safetyRoutes);
app.use('/api/admin', adminRoutes);     

// --- 6. Root Test Route ---
app.get('/', (req, res) => {
    res.send('✅ WIKA Maintenance API is Running with MSSQL');
});

// --- 7. Global Error Handler ---
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});