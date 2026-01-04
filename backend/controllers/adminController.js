const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcryptjs');

// --- 1. GET JOB MASTER DATA (For Dropdowns) ---
exports.getJobMasterData = async (req, res) => {
    try {
        const pool = await poolPromise;
        // Ensure you have run the SQL to create these two new tables
        const depts = await pool.request().query('SELECT * FROM Departments');
        const desigs = await pool.request().query('SELECT * FROM Designations');
        
        res.json({
            departments: depts.recordset,
            designations: desigs.recordset
        });
    } catch (err) {
        console.error("Master Data Error:", err);
        // If tables don't exist yet, return empty arrays so frontend doesn't crash
        res.json({ departments: [], designations: [] });
    }
};

// --- 2. GET EMPLOYEES (Filtered by Location + Roles) ---
exports.getEmployees = async (req, res) => {
    const { adminId } = req.query; 

    if (!adminId) {
        return res.status(400).json({ message: "Admin ID is required" });
    }

    try {
        const pool = await poolPromise;

        // Step A: Find Admin's Location
        const adminCheck = await pool.request()
            .input('aid', sql.NVarChar, adminId)
            .query('SELECT PlantLocation FROM Employees WHERE GlobalID = @aid');
        
        const myLocation = adminCheck.recordset[0]?.PlantLocation;

        if (!myLocation) {
            return res.status(403).json({ message: "Unauthorized: Unknown Location" });
        }

        // Step B: Fetch Employees + Dept Name + Desig Name
        // Note: We use LEFT JOIN so if DeptID/DesigID are null (old users), it still works
        const query = `
            SELECT 
                E.GlobalID, E.FullName, E.Email, E.PlantLocation, E.IsActive,
                D.DeptName, G.DesigName
            FROM Employees E
            LEFT JOIN Departments D ON E.DeptID = D.DeptID
            LEFT JOIN Designations G ON E.DesigID = G.DesigID
            WHERE E.PlantLocation = @loc
        `;

        const users = await pool.request()
            .input('loc', sql.NVarChar, myLocation)
            .query(query);
        
        // Step C: Fetch Roles (USING YOUR EXISTING TABLE 'EmployeeRoles')
        const roles = await pool.request().query('SELECT * FROM EmployeeRoles');

        // Step D: Merge Data
        const combined = users.recordset.map(u => ({
            id: u.GlobalID,
            GlobalID: u.GlobalID,
            name: u.FullName,
            email: u.Email,
            location: u.PlantLocation,
            isActive: u.IsActive,
            department: u.DeptName || 'N/A',   
            designation: u.DesigName || 'N/A', 
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

// --- 3. ADD NEW EMPLOYEE (Auto-Assign Roles) ---
exports.addEmployee = async (req, res) => {
    const { globalId, name, email, location, password, deptId, desigId } = req.body;

    if (!globalId || !name || !email || !location) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const pool = await poolPromise;
        
        // Hash Password (default '12345' if not sent, though frontend sends it)
        const passToHash = password || '12345';
        const hashedPassword = await bcrypt.hash(passToHash, 10);

        // A. Insert Employee
        // We insert DeptID and DesigID into Employees table
        await pool.request()
            .input('gid', sql.NVarChar, globalId)
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('loc', sql.NVarChar, location) 
            .input('pass', sql.NVarChar, hashedPassword)
            .input('dept', sql.Int, deptId || null)
            .input('desig', sql.Int, desigId || null)
            .query(`
                INSERT INTO Employees (GlobalID, FullName, Email, PlantLocation, PasswordHash, IsActive, DeptID, DesigID)
                VALUES (@gid, @name, @email, @loc, @pass, 1, @dept, @desig)
            `);
            
        // B. AUTO-ASSIGN PERMISSIONS based on DefaultAccessRules
        // This checks the RULES table to decide what to insert into EmployeeRoles
        if (deptId && desigId) {
            const rulesResult = await pool.request()
                .input('dept', sql.Int, deptId)
                .input('desig', sql.Int, desigId)
                .query(`
                    SELECT ModulePrefix, RoleCode 
                    FROM DefaultAccessRules 
                    WHERE DeptID = @dept AND DesigID = @desig
                `);

            if (rulesResult.recordset.length > 0) {
                const transaction = new sql.Transaction(pool);
                await transaction.begin();
                try {
                    const request = new sql.Request(transaction);
                    for (const rule of rulesResult.recordset) {
                        // Inserting into YOUR EXISTING EmployeeRoles table
                        // rule.ModulePrefix maps to DepartmentCode (e.g., 'FAC')
                        await request.query(`
                            INSERT INTO EmployeeRoles (GlobalID, DepartmentCode, RoleCode)
                            VALUES ('${globalId}', '${rule.ModulePrefix}', '${rule.RoleCode}')
                        `);
                    }
                    await transaction.commit();
                } catch (permError) {
                    console.error("Auto-permission failed:", permError);
                    await transaction.rollback();
                }
            } else {
                // Fallback: If no rule exists for this designation, give basic 'USR' access
                await pool.request()
                    .input('gid', sql.NVarChar, globalId)
                    .query("INSERT INTO EmployeeRoles (GlobalID, DepartmentCode, RoleCode) VALUES (@gid, 'FAC', 'USR')");
            }
        } else {
            // Fallback if Dept/Desig not provided
            await pool.request()
                .input('gid', sql.NVarChar, globalId)
                .query("INSERT INTO EmployeeRoles (GlobalID, DepartmentCode, RoleCode) VALUES (@gid, 'FAC', 'USR')");
        }

        res.json({ message: "Employee Added Successfully" });

    } catch (err) {
        console.error("Add Employee Error:", err);
        if (err.number === 2627) {
            return res.status(400).json({ message: "Employee ID already exists" });
        }
        res.status(500).json({ message: "Failed to add employee" });
    }
};

// --- 4. UPDATE USER ROLES (Manual Override) ---
exports.updateAccess = async (req, res) => {
    const { globalId, roles } = req.body; 
    // roles example: [{ RoleCode: 'ADM', DepartmentCode: 'FAC' }]
    
    if (!globalId || !roles) {
        return res.status(400).json({ message: "Invalid Data" });
    }

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        
        await transaction.begin();
        const request = new sql.Request(transaction);

        // Step A: Wipe all existing permissions for this user
        await request.input('gid', sql.NVarChar, globalId)
                     .query("DELETE FROM EmployeeRoles WHERE GlobalID = @gid");

        // Step B: Insert new list
        for (const role of roles) {
            const req2 = new sql.Request(transaction);
            // Ensure we use RoleCode and DepartmentCode matching your table
            await req2.input('gid', sql.NVarChar, globalId)
                      .input('rc', sql.NVarChar, role.RoleCode)
                      .input('dc', sql.NVarChar, role.DepartmentCode || role.Module) // Handle frontend naming mismatch
                      .query("INSERT INTO EmployeeRoles (GlobalID, DepartmentCode, RoleCode) VALUES (@gid, @dc, @rc)");
        }

        await transaction.commit();
        res.json({ message: "Permissions Updated Successfully" });

    } catch (err) {
        console.error("Update Access Error:", err);
        res.status(500).json({ message: "Failed to update permissions" });
    }
};

// ... existing imports

// --- 5. MANAGE DEPARTMENTS & DESIGNATIONS ---
exports.manageJobMaster = async (req, res) => {
    const { type, action, id, name } = req.body; 
    // type: 'DEPT' or 'DESIG'
    // action: 'ADD' or 'DELETE'

    try {
        const pool = await poolPromise;
        
        if (action === 'ADD') {
            if (type === 'DEPT') {
                await pool.request().input('n', sql.VarChar, name).query("INSERT INTO Departments (DeptName) VALUES (@n)");
            } else {
                await pool.request().input('n', sql.VarChar, name).query("INSERT INTO Designations (DesigName) VALUES (@n)");
            }
            return res.json({ message: "Added Successfully" });
        } 
        
        if (action === 'DELETE') {
            if (type === 'DEPT') {
                // Optional: Check if used in Employees/Rules before deleting
                await pool.request().input('id', sql.Int, id).query("DELETE FROM Departments WHERE DeptID = @id");
            } else {
                await pool.request().input('id', sql.Int, id).query("DELETE FROM Designations WHERE DesigID = @id");
            }
            return res.json({ message: "Deleted Successfully" });
        }

    } catch (err) {
        console.error("Manage Master Error:", err);
        res.status(500).json({ message: "Operation failed (Item might be in use)" });
    }
};

// --- 6. GET & MANAGE ACCESS RULES ---
exports.getAccessRules = async (req, res) => {
    try {
        const pool = await poolPromise;
        // Fetch all rules with names joined
        const query = `
            SELECT R.RuleID, D.DeptName, G.DesigName, R.ModulePrefix, R.RoleCode
            FROM DefaultAccessRules R
            JOIN Departments D ON R.DeptID = D.DeptID
            JOIN Designations G ON R.DesigID = G.DesigID
            ORDER BY D.DeptName, G.DesigName
        `;
        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: "Failed to load rules" });
    }
};

exports.addAccessRule = async (req, res) => {
    const { deptId, desigId, roles } = req.body; 
    // roles: [{ Module: 'FAC', Role: 'ADM' }, ...]

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        const request = new sql.Request(transaction);

        // First, delete existing rules for this specific combination to avoid duplicates
        await request.input('d', sql.Int, deptId).input('g', sql.Int, desigId)
                     .query("DELETE FROM DefaultAccessRules WHERE DeptID = @d AND DesigID = @g");

        // Insert new rules
        for (const role of roles) {
            const req2 = new sql.Request(transaction);
            await req2.input('d', sql.Int, deptId)
                      .input('g', sql.Int, desigId)
                      .input('m', sql.VarChar, role.Module)
                      .input('r', sql.VarChar, role.Role)
                      .query("INSERT INTO DefaultAccessRules (DeptID, DesigID, ModulePrefix, RoleCode) VALUES (@d, @g, @m, @r)");
        }

        await transaction.commit();
        res.json({ message: "Rules Saved Successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to save rules" });
    }
};

exports.deleteAccessRule = async (req, res) => {
    const { ruleId } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request().input('id', sql.Int, ruleId).query("DELETE FROM DefaultAccessRules WHERE RuleID = @id");
        res.json({ message: "Rule Deleted" });
    } catch (err) {
        res.status(500).json({ message: "Delete failed" });
    }
};