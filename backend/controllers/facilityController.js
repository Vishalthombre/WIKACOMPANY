const { poolPromise, sql } = require('../config/db');

// --- 1. GET TICKETS (Location Filtered) ---
exports.getAllTickets = async (req, res) => {
    const { location } = req.query; 
    try {
        const pool = await poolPromise;
        const locFilter = location || ''; 

        const result = await pool.request()
            .input('loc', sql.NVarChar, locFilter)
            .query(`
                SELECT * FROM Tickets 
                WHERE PlantLocation = @loc AND DepartmentCode = 'FAC'
                ORDER BY CreatedAt DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL Get Tickets Error:', err);
        res.status(500).json({ message: 'Database Error fetching tickets' });
    }
};

// --- 2. GET DROPDOWN DATA ---
exports.getDropdownData = async (req, res) => {
    const { location } = req.query;
    try {
        const pool = await poolPromise;
        const [buildings, areas, subAreas, keywords] = await Promise.all([
            pool.request().input('loc', sql.NVarChar, location || '').query('SELECT * FROM Buildings WHERE PlantLocation = @loc'),
            pool.request().query('SELECT * FROM Areas'),
            pool.request().query('SELECT * FROM SubAreas'),
            pool.request().query('SELECT * FROM IssueKeywords')
        ]);

        const formattedLocations = buildings.recordset.map(b => ({
            id: b.BuildingID,
            name: b.BuildingName,
            areas: areas.recordset
                .filter(a => a.BuildingID === b.BuildingID)
                .map(a => ({
                    id: a.AreaID,
                    name: a.AreaName,
                    subAreas: subAreas.recordset
                        .filter(s => s.AreaID === a.AreaID)
                        .map(s => s.SubAreaName)
                }))
        }));

        res.json({
            locations: formattedLocations,
            keywords: keywords.recordset.map(k => k.KeywordName)
        });
    } catch (err) {
        console.error('Dropdown Error:', err);
        res.status(500).json({ message: 'Failed to load dropdowns' });
    }
};

// --- 3. TICKET OPERATIONS ---

exports.createTicket = async (req, res) => {
    // Debug Log: Check what data is actually arriving
    console.log("📥 Receiving Ticket Data:", req.body);

    const { raiserID, raiserName, location, building, area, subArea, keyword, description } = req.body;

    // Safety Check: Ensure required fields exist
    if (!raiserID || !location) {
        console.error("❌ Missing Required Field: RaiserID or Location is null");
        return res.status(400).json({ message: "User ID or Location missing. Try logging out and back in." });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('rid', sql.NVarChar, raiserID)
            .input('rname', sql.NVarChar, raiserName)
            .input('loc', sql.NVarChar, location)
            .input('bld', sql.NVarChar, building)
            .input('area', sql.NVarChar, area)
            .input('sub', sql.NVarChar, subArea)
            .input('kw', sql.NVarChar, keyword)
            .input('desc', sql.NVarChar, description)
            .query(`
                INSERT INTO Tickets 
                (RaiserID, RaiserName, PlantLocation, BuildingName, AreaName, SubAreaName, IssueCategory, Description, Status, DepartmentCode)
                OUTPUT INSERTED.TicketID, INSERTED.CreatedAt
                VALUES 
                (@rid, @rname, @loc, @bld, @area, @sub, @kw, @desc, 'Open', 'FAC')
            `);
        
        const newTicket = result.recordset[0];
        console.log("✅ Ticket Created:", newTicket.TicketID);
        res.json({ message: "Ticket Created", ticket: { TicketID: newTicket.TicketID, ...req.body } });
    } catch (err) {
        console.error('❌ SQL Create Ticket Error:', err);
        res.status(500).json({ message: 'Failed to create ticket. Check Server Logs.' });
    }
};

exports.assignTicket = async (req, res) => {
    const { ticketId, techId, techName, plannerName } = req.body;
    
    // Safety handling for ID format
    const dbId = String(ticketId).replace('TKT-', ''); 

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('tid', sql.Int, dbId)
            .input('techId', sql.NVarChar, techId)
            .input('techName', sql.NVarChar, techName)
            .input('planner', sql.NVarChar, plannerName)
            .query(`
                UPDATE Tickets 
                SET AssignedToID = @techId, AssignedToName = @techName, PlannedBy = @planner, Status = 'Assigned'
                WHERE TicketID = @tid
            `);
        res.json({ message: "Ticket Assigned" });
    } catch (err) {
        console.error("Assign Error:", err);
        res.status(500).json({ message: "Assignment Failed" });
    }
};

exports.updateStatus = async (req, res) => {
    const { ticketId, status } = req.body;
    const dbId = String(ticketId).replace('TKT-', '');

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('tid', sql.Int, dbId)
            .input('status', sql.NVarChar, status)
            .query('UPDATE Tickets SET Status = @status WHERE TicketID = @tid');
        res.json({ message: "Status Updated" });
    } catch (err) {
        res.status(500).json({ message: "Update Failed" });
    }
};

exports.deleteTicket = async (req, res) => {
    const { id } = req.params;
    const dbId = String(id).replace('TKT-', ''); 

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('tid', sql.Int, dbId)
            .query('DELETE FROM Tickets WHERE TicketID = @tid');
        res.json({ message: "Ticket Deleted" });
    } catch (err) {
        res.status(500).json({ message: "Delete Failed" });
    }
};

exports.getTechnicians = async (req, res) => {
    const { location } = req.query;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('loc', sql.NVarChar, location || '')
            .query(`
                SELECT e.GlobalID as id, e.FullName as name 
                FROM Employees e
                JOIN EmployeeRoles er ON e.GlobalID = er.GlobalID
                WHERE er.RoleCode = 'TEC' AND e.PlantLocation = @loc
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: "Failed to load technicians" });
    }
};

// --- 4. MASTER DATA MANAGEMENT (Returns IDs for Instant UI Update) ---

exports.addBuilding = async (req, res) => {
    const { name, location } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('loc', sql.NVarChar, location)
            .query('INSERT INTO Buildings (BuildingName, PlantLocation) OUTPUT INSERTED.BuildingID VALUES (@name, @loc)');
        
        res.json({ success: true, id: result.recordset[0].BuildingID, name });
    } catch (err) { res.status(500).json({ message: "Error adding building" }); }
};

exports.deleteBuilding = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request().input('id', sql.Int, id).query('DELETE FROM Buildings WHERE BuildingID = @id');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: "Error deleting building" }); }
};

exports.addArea = async (req, res) => {
    const { buildingId, name } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('bid', sql.Int, buildingId)
            .input('name', sql.NVarChar, name)
            .query('INSERT INTO Areas (AreaName, BuildingID) OUTPUT INSERTED.AreaID VALUES (@name, @bid)');
        
        res.json({ success: true, id: result.recordset[0].AreaID, name, buildingId });
    } catch (err) { res.status(500).json({ message: "Error adding area" }); }
};

exports.deleteArea = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request().input('id', sql.Int, id).query('DELETE FROM Areas WHERE AreaID = @id');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: "Error deleting area" }); }
};

exports.addSubArea = async (req, res) => {
    const { areaId, name } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('aid', sql.Int, areaId)
            .input('name', sql.NVarChar, name)
            .query('INSERT INTO SubAreas (SubAreaName, AreaID) VALUES (@name, @aid)');
        res.json({ success: true, name, areaId });
    } catch (err) { res.status(500).json({ message: "Error adding subarea" }); }
};

exports.deleteSubArea = async (req, res) => {
    const { areaId, name } = req.body; 
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('aid', sql.Int, areaId)
            .input('name', sql.NVarChar, name)
            .query('DELETE FROM SubAreas WHERE AreaID = @aid AND SubAreaName = @name');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: "Error deleting subarea" }); }
};

exports.addKeyword = async (req, res) => {
    const { name } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request().input('name', sql.NVarChar, name).query('INSERT INTO IssueKeywords (KeywordName) VALUES (@name)');
        res.json({ success: true, name });
    } catch (err) { res.status(500).json({ message: "Error adding keyword" }); }
};

exports.deleteKeyword = async (req, res) => {
    const { name } = req.params; 
    try {
        const pool = await poolPromise;
        await pool.request().input('name', sql.NVarChar, name).query('DELETE FROM IssueKeywords WHERE KeywordName = @name');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: "Error deleting keyword" }); }
};