const { poolPromise, sql } = require('../config/db');

// --- LOGIN ---
exports.login = async (req, res) => {
    const { globalId, password } = req.body;

    if (!globalId || !password) {
        return res.status(400).json({ message: "Global ID and Password Required" });
    }

    try {
        const pool = await poolPromise;

        // 1. Get User Details
        const userResult = await pool.request()
            .input('gid', sql.NVarChar, globalId)
            .query('SELECT * FROM Employees WHERE GlobalID = @gid');

        const user = userResult.recordset[0];

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // 2. Check Password
        if (user.PasswordHash !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // 3. Check Activation Status (For new users)
        // If IsActive is 0 or null (false), force them to set a password
        if (!user.IsActive) {
            return res.status(403).json({ 
                message: "Account Not Activated", 
                needsActivation: true // Frontend uses this to trigger the "Set Password" modal
            });
        }

        // 4. Get Roles (Access Matrix)
        const rolesResult = await pool.request()
            .input('gid', sql.NVarChar, user.GlobalID)
            .query('SELECT RoleCode, DepartmentCode FROM EmployeeRoles WHERE GlobalID = @gid');

        // 5. Send Response (Includes PlantLocation for Multi-Plant Logic)
        res.json({
            message: "Login Successful",
            user: {
                id: user.GlobalID,
                name: user.FullName,
                email: user.Email,
                location: user.PlantLocation, // CRITICAL: Used to filter data by Plant (Pune, Ghaziabad, etc.)
                // Logic: A user sees the "System Admin" button if they have 'ADM' role in 'FAC' department
                IsSystemAdmin: rolesResult.recordset.some(r => r.RoleCode === 'ADM' && r.DepartmentCode === 'FAC') 
            },
            roles: rolesResult.recordset // e.g. [{ RoleCode: 'ADM', DepartmentCode: 'SAF' }]
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: "Server Error" });
    }
};

// --- ACTIVATE ACCOUNT (Set Password) ---
exports.activateAccount = async (req, res) => {
    const { globalId, password } = req.body;

    if (!globalId || !password) {
        return res.status(400).json({ message: "Global ID and New Password are required" });
    }

    try {
        const pool = await poolPromise;
        
        // Updates password AND sets account to Active (1)
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

// --- VERIFY ID (Used in Activation Screen) ---
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

        // Return details so user knows they are activating the right account
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