require('dotenv').config();
const express = require('express');
const cors = require('cors');
// Import the DB connection promise to check connectivity
const { poolPromise } = require('./config/db');

const app = express();

// --- 1. Middleware ---
app.use(cors()); // Allows Frontend (Port 5173/3000) to talk to Backend (Port 5000)
app.use(express.json()); // Allows parsing JSON bodies (req.body)

// --- 2. Database Connection Check (New & Important) ---
// This logs a success/error message when the server starts
poolPromise.then(() => {
    console.log('✅ Connected to MSSQL Database');
}).catch(err => {
    console.error('❌ Database Connection Failed:', err);
});

// --- 3. Import Routes ---
const authRoutes = require('./routes/authRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const adminRoutes = require('./routes/adminRoutes');

// --- 4. Mount Routes ---
app.use('/api/auth', authRoutes);       // Login, Activation, Permissions
app.use('/api/facility', facilityRoutes); // Tickets, Technicians, Dropdowns
app.use('/api/admin', adminRoutes);     // Employee Management, Roles

// --- 5. Root Test Route ---
app.get('/', (req, res) => {
    res.send('✅ WIKA Maintenance API is Running with MSSQL');
});

// --- 6. Global Error Handler (Prevents server crashes) ---
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});