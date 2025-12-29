const { poolPromise, sql } = require('../config/db');

// --- 1. GET EMPLOYEES (Filtered by Admin's Location) ---
exports.getEmployees = async (req, res) => {
    // Frontend must pass ?adminId=G001 in the URL
    const { adminId } = req.query; 

    if (!adminId) {
        return res.status(400).json({ message: "Admin ID is required" });
    }

    try {
        const pool = await poolPromise;

        // Step A: Find the Admin's own location
        const adminCheck = await pool.request()
            .input('aid', sql.NVarChar, adminId)
            .query('SELECT PlantLocation FROM Employees WHERE GlobalID = @aid');
        
        const myLocation = adminCheck.recordset[0]?.PlantLocation;

        if (!myLocation) {
            return res.status(403).json({ message: "Unauthorized: Unknown Location" });
        }

        // Step B: Fetch ONLY employees belonging to that same location
        const users = await pool.request()
            .input('loc', sql.NVarChar, myLocation)
            .query('SELECT * FROM Employees WHERE PlantLocation = @loc');
        
        // Step C: Fetch Roles for those employees to build the permissions matrix
        // We fetch all roles first, then map them in JS (more efficient than N+1 queries)
        const roles = await pool.request().query('SELECT * FROM EmployeeRoles');

        // Step D: Merge Data for Frontend
        const combined = users.recordset.map(u => ({
            id: u.GlobalID,          // Frontend expects 'id'
            GlobalID: u.GlobalID,
            name: u.FullName,        // Frontend expects 'name'
            email: u.Email,
            location: u.PlantLocation,
            isActive: u.IsActive,    // Useful to show "Pending Activation" status
            roles: roles.recordset
                .filter(r => r.GlobalID === u.GlobalID)
                .map(r => ({ 
                    RoleCode: r.RoleCode, 
                    DepartmentCode: r.DepartmentCode 
                }))
        }));

        res.json(combined);

    } catch (err) {
        console.error("Get Employees Error:", err);
        res.status(500).json({ message: "Database Error" });
    }
};

// --- 2. ADD NEW EMPLOYEE ---
exports.addEmployee = async (req, res) => {
    // Note: location comes from the form, but ideally should be forced to Admin's location
    const { globalId, name, email, location } = req.body; 

    if (!globalId || !name || !email || !location) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const pool = await poolPromise;
        
        // Insert new user. 
        // Default Password: '12345'
        // IsActive: 0 (User must run "Activate Account" to set real password)
        await pool.request()
            .input('gid', sql.NVarChar, globalId)
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('loc', sql.NVarChar, location) 
            .query(`
                INSERT INTO Employees (GlobalID, FullName, Email, PlantLocation, PasswordHash, IsActive)
                VALUES (@gid, @name, @email, @loc, '12345', 0)
            `);
            
        // Automatically give them 'USR' (Raiser) access to 'FAC' (Facility)
        // so they can at least log in and see the dashboard.
        await pool.request()
            .input('gid', sql.NVarChar, globalId)
            .query("INSERT INTO EmployeeRoles (GlobalID, RoleCode, DepartmentCode) VALUES (@gid, 'USR', 'FAC')");

        res.json({ message: "Employee Added Successfully" });

    } catch (err) {
        console.error("Add Employee Error:", err);
        if (err.number === 2627) {
            return res.status(400).json({ message: "Employee ID already exists" });
        }
        res.status(500).json({ message: "Failed to add employee" });
    }
};

// --- 3. UPDATE USER ROLES (The Matrix) ---
exports.updateAccess = async (req, res) => {
    const { globalId, roles } = req.body; 
    // roles example: [{ RoleCode: 'ADM', DepartmentCode: 'FAC' }, { RoleCode: 'PLN', DepartmentCode: 'SAF' }]
    
    if (!globalId || !roles) {
        return res.status(400).json({ message: "Invalid Data" });
    }

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        
        // Start Transaction
        await transaction.begin();
        const request = new sql.Request(transaction);

        // Step A: Wipe all existing roles for this user
        await request.input('gid', sql.NVarChar, globalId)
                     .query("DELETE FROM EmployeeRoles WHERE GlobalID = @gid");

        // Step B: Insert the new list of roles one by one
        for (const role of roles) {
            const req2 = new sql.Request(transaction);
            await req2.input('gid', sql.NVarChar, globalId)
                      .input('rc', sql.NVarChar, role.RoleCode)
                      .input('dc', sql.NVarChar, role.DepartmentCode)
                      .query("INSERT INTO EmployeeRoles (GlobalID, RoleCode, DepartmentCode) VALUES (@gid, @rc, @dc)");
        }

        // Commit Changes
        await transaction.commit();
        res.json({ message: "Roles Updated Successfully" });

    } catch (err) {
        console.error("Update Access Error:", err);
        // transaction.rollback() happens automatically on error in some drivers, 
        // but it's safe to just return error here as the connection closes.
        res.status(500).json({ message: "Failed to update roles" });
    }
};