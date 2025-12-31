const { poolPromise, sql } = require('../config/db');

// --- 1. GET MASTER DATA (Nested: Building -> Area -> SubArea) ---
exports.getMasterData = async (req, res) => {
    const { location } = req.query; 

    try {
        const pool = await poolPromise;
        console.log(`🔍 [Safety] Fetching Master Data for: ${location}`);

        // Run 4 queries in parallel: Buildings, Areas, SubAreas, Keywords
        const [buildings, areas, subAreas, keywords] = await Promise.all([
            pool.request().input('loc', sql.NVarChar, location || '').query("SELECT * FROM Buildings WHERE PlantLocation = @loc"),
            pool.request().query("SELECT * FROM Areas"), 
            pool.request().query("SELECT * FROM SubAreas"), // Fetch all subareas
            pool.request().query("SELECT * FROM SafetyKeywords")
        ]);

        // CONSTRUCTION: Nest SubAreas -> Areas -> Buildings
        const formattedLocations = buildings.recordset.map(b => ({
            id: b.BuildingID,
            name: b.BuildingName,
            areas: areas.recordset
                .filter(a => a.BuildingID === b.BuildingID)
                .map(a => ({
                    id: a.AreaID,
                    name: a.AreaName,
                    // Nested SubAreas
                    subAreas: subAreas.recordset
                        .filter(s => s.AreaID === a.AreaID)
                        .map(s => ({
                            id: s.SubAreaID,
                            name: s.SubAreaName
                        }))
                }))
        }));

        const formattedHazards = keywords.recordset.map(k => k.name);

        console.log(`✅ [Safety] Loaded full location hierarchy.`);

        res.json({
            locations: formattedLocations, // Full Hierarchy
            hazards: formattedHazards
        });

    } catch (err) {
        console.error('❌ [Safety] Master Data Error:', err);
        res.status(500).json({ message: 'Failed to load safety dropdowns.' });
    }
};

// --- 2. CREATE TICKET (With SubArea) ---
exports.createTicket = async (req, res) => {
    console.log("📥 [Safety] Ticket Data:", req.body);

    const { raiserId, raiserName, location, buildingId, areaId, subAreaId, hazardType, description } = req.body;
    
    let imageUrl = null;
    if (req.file) imageUrl = '/uploads/safety/' + req.file.filename;

    try {
        const pool = await poolPromise;

        // Fetch Names for Snapshotting
        const nameLookup = await pool.request()
            .input('bid', sql.Int, buildingId)
            .input('aid', sql.Int, areaId || 0)
            .input('sid', sql.Int, subAreaId || 0)
            .query(`
                SELECT BuildingName FROM Buildings WHERE BuildingID = @bid;
                SELECT AreaName FROM Areas WHERE AreaID = @aid;
                SELECT SubAreaName FROM SubAreas WHERE SubAreaID = @sid;
            `);
        
        const buildingName = nameLookup.recordsets[0][0]?.BuildingName || 'Unknown';
        const areaName = nameLookup.recordsets[1][0]?.AreaName || '';
        const subAreaName = nameLookup.recordsets[2][0]?.SubAreaName || '';

        await pool.request()
            // CHANGE THIS: Use sql.NVarChar instead of sql.Int
            .input('rid', sql.NVarChar, raiserId) 
            .input('rname', sql.NVarChar, raiserName)
            .input('loc', sql.NVarChar, location)
            .input('bid', sql.Int, buildingId) // Building ID is fine as Int
            .input('bname', sql.NVarChar, buildingName)
            .input('aid', sql.Int, areaId || null)
            .input('aname', sql.NVarChar, areaName)
            .input('sid', sql.Int, subAreaId || null)
            .input('sname', sql.NVarChar, subAreaName)
            .input('kw', sql.NVarChar, hazardType)
            .input('desc', sql.NVarChar, description)
            .input('img', sql.NVarChar, imageUrl)
            .query(`
                INSERT INTO SafetyTickets 
                (RaiserID, RaiserName, Location, BuildingID, BuildingName, AreaID, AreaName, SubAreaID, SubAreaName, Keyword, Description, ImageUrl, Status)
                OUTPUT INSERTED.TicketID
                VALUES 
                (@rid, @rname, @loc, @bid, @bname, @aid, @aname, @sid, @sname, @kw, @desc, @img, 'Open')
            `);

        res.json({ message: 'Safety Ticket Created' });

    } catch (err) {
        console.error('❌ [Safety] Create Error:', err);
        res.status(500).json({ message: 'Failed to create ticket' });
    }
};

// ... (Keep other functions like getAllTickets, etc. unchanged) ...
exports.getAllTickets = async (req, res) => {
    const { location } = req.query;
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('loc', sql.NVarChar, location || '').query("SELECT * FROM SafetyTickets WHERE Location = @loc ORDER BY CreatedAt DESC");
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- 6. GET TECHNICIANS ---
exports.getTechnicians = async (req, res) => {
    const { location } = req.query;
    try {
        // FIX: Define pool before using it
        const pool = await poolPromise; 

        // Added DISTINCT to prevent duplicate technician entries (fixes the frontend key error too)
        const result = await pool.request()
            .input('loc', sql.NVarChar, location || '')
            .query(`
                SELECT DISTINCT e.GlobalID as id, e.FullName as name 
                FROM Employees e
                JOIN EmployeeRoles er ON e.GlobalID = er.GlobalID
                WHERE er.RoleCode = 'TEC' AND e.PlantLocation = @loc
            `);
            
        res.json(result.recordset);
    } catch (err) {
        console.error('❌ [Safety] Get Techs Error:', err);
        res.status(500).json({ message: "Failed to load technicians" });
    }
};

// --- 4. ASSIGN TICKET ---
exports.assignTicket = async (req, res) => {
    const { ticketId, techId, techName, plannerName } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('tid', sql.Int, ticketId)
            // FIX: Use NVarChar because Tech ID might be alphanumeric (e.g. 'G123')
            .input('techId', sql.NVarChar, techId) 
            .input('techName', sql.NVarChar, techName)
            .input('planner', sql.NVarChar, plannerName)
            .query(`
                UPDATE SafetyTickets 
                SET AssignedToID = @techId, AssignedToName = @techName, PlannerName = @planner, Status = 'Assigned'
                WHERE TicketID = @tid
            `);
        res.json({ message: 'Assigned successfully' });
    } catch (err) {
        console.error("Assign Error:", err); // Log error to see details
        res.status(500).json({ message: err.message });
    }
};

exports.updateStatus = async (req, res) => {
    const { ticketId, status } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request().input('tid', sql.Int, ticketId).input('status', sql.NVarChar, status)
            .query("UPDATE SafetyTickets SET Status = @status WHERE TicketID = @tid");
        res.json({ message: 'Status updated' });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- 7. DELETE TICKET ---
exports.deleteTicket = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('tid', sql.Int, id)
            .query('DELETE FROM SafetyTickets WHERE TicketID = @tid');
        
        res.json({ message: "Ticket Deleted Successfully" });
    } catch (err) {
        console.error('Delete Error:', err);
        res.status(500).json({ message: "Failed to delete ticket" });
    }
};