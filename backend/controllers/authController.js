const { poolPromise } = require('../config/db');
const sql = require('mssql');

// 1. UPDATE LOGIN FUNCTION
exports.login = async (req, res) => {
    const { globalId, password } = req.body;
    try {
        const pool = await poolPromise;
        
        // Fetch user AND their ProfileImage
        const result = await pool.request()
            .input('id', sql.VarChar, globalId)
            .query(`
                SELECT GlobalID, FullName, Email, PasswordHash, PlantLocation, ProfileImage 
                FROM Employees 
                WHERE GlobalID = @id
            `);

        const user = result.recordset[0];

        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Simple password check
        if (password !== user.PasswordHash) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Get Roles
        const roleResult = await pool.request()
            .input('id', sql.VarChar, globalId)
            .query('SELECT DepartmentCode, RoleCode FROM EmployeeRoles WHERE GlobalID = @id');

        // ✅ FIX: Send data wrapped in 'user' object to match Frontend 'api.js'
        res.json({
            token: "active", // Dummy token (Replace with JWT if you use it)
            user: {
                GlobalID: user.GlobalID,     // Keep DB column names for Frontend mapping
                FullName: user.FullName,
                Email: user.Email,
                PlantLocation: user.PlantLocation,
                ProfileImage: user.ProfileImage, 
                roles: roleResult.recordset
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: 'Server error' });
    }
};

// 2. UPDATE PROFILE PICTURE
exports.updateProfilePic = async (req, res) => {
    const { globalId, imageBase64 } = req.body;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.VarChar, globalId)
            .input('img', sql.NVarChar(sql.MAX), imageBase64)
            .query('UPDATE Employees SET ProfileImage = @img WHERE GlobalID = @id');

        res.json({ message: 'Profile updated successfully', profileImage: imageBase64 });
    } catch (err) {
        console.error("Profile Update Error:", err);
        res.status(500).json({ message: 'Failed to update image' });
    }
};

// --- ACTIVATE ACCOUNT ---
exports.activateAccount = async (req, res) => {
    const { globalId, password } = req.body;

    if (!globalId || !password) {
        return res.status(400).json({ message: "Global ID and New Password are required" });
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('gid', sql.NVarChar, globalId)
            .input('pass', sql.NVarChar, password)
            .query('UPDATE Employees SET PasswordHash = @pass, IsActive = 1 WHERE GlobalID = @gid');

        res.json({ success: true, message: "Account Activated. Please Login." });
    } catch (err) {
        console.error("Activation Error:", err);
        res.status(500).json({ message: "Activation Failed" });
    }
};

// --- GET PERMISSIONS ---
exports.getPermissions = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('gid', sql.NVarChar, id)
            .query('SELECT RoleCode, DepartmentCode FROM EmployeeRoles WHERE GlobalID = @gid');
        
        res.json(result.recordset);
    } catch (err) {
        console.error("Permission Fetch Error:", err);
        res.status(500).json({ message: "Failed to fetch permissions" });
    }
};

// --- VERIFY ID ---
exports.verifyUser = async (req, res) => {
    const { globalId } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('gid', sql.NVarChar, globalId)
            .query('SELECT GlobalID, FullName, Email, PlantLocation, IsActive FROM Employees WHERE GlobalID = @gid');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Global ID not found" });
        }

        const user = result.recordset[0];

        if (user.IsActive) {
            return res.status(400).json({ message: "Account already active. Please Login." });
        }

        res.json({ 
            Name: user.FullName, 
            Email: user.Email, 
            Location: user.PlantLocation 
        });

    } catch (err) {
        console.error("Verify Error:", err);
        res.status(500).json({ message: "Verification failed" });
    }
};