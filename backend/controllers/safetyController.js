const { poolPromise, sql } = require('../config/db');

// --- 1. GET MASTER DATA (Nested: Building -> Area -> SubArea) ---
exports.getMasterData = async (req, res) => {
    const { location } = req.query; 

    try {
        const pool = await poolPromise;
        console.log(`🔍 [Safety] Fetching Master Data for: ${location}`);

        const [buildings, areas, subAreas, keywords] = await Promise.all([
            pool.request().input('loc', sql.NVarChar, location || '').query("SELECT * FROM Buildings WHERE PlantLocation = @loc"),
            pool.request().query("SELECT * FROM Areas"), 
            pool.request().query("SELECT * FROM SubAreas"), 
            pool.request().query("SELECT * FROM SafetyKeywords")
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
                        .map(s => ({
                            id: s.SubAreaID,
                            name: s.SubAreaName
                        }))
                }))
        }));

        const formattedHazards = keywords.recordset.map(k => k.name);

        console.log(`✅ [Safety] Loaded full location hierarchy.`);

        res.json({
            locations: formattedLocations,
            hazards: formattedHazards
        });

    } catch (err) {
        console.error('❌ [Safety] Master Data Error:', err);
        res.status(500).json({ message: 'Failed to load safety dropdowns.' });
    }
};

// --- 2. CREATE TICKET (Base64 Image Storage) ---
exports.createTicket = async (req, res) => {
    console.log("📥 [Safety] Ticket Data:", req.body);

    const { raiserId, raiserName, location, buildingId, areaId, subAreaId, hazardType, description } = req.body;
    
    let imageBase64 = null;

    // --- CONVERT IMAGE TO BASE64 STRING ---
    // If a file was uploaded, convert its buffer to a Base64 string.
    // This string IS the image. It will be stored directly in the DB.
    if (req.file) {
        const b64 = req.file.buffer.toString('base64');
        imageBase64 = `data:${req.file.mimetype};base64,${b64}`;
    }

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
            .input('rid', sql.NVarChar, raiserId) 
            .input('rname', sql.NVarChar, raiserName)
            .input('loc', sql.NVarChar, location)
            .input('bid', sql.Int, buildingId) 
            .input('bname', sql.NVarChar, buildingName)
            .input('aid', sql.Int, areaId || null)
            .input('aname', sql.NVarChar, areaName)
            .input('sid', sql.Int, subAreaId || null)
            .input('sname', sql.NVarChar, subAreaName)
            .input('kw', sql.NVarChar, hazardType)
            .input('desc', sql.NVarChar, description)
            // Save the HUGE Base64 string directly to the DB.
            // Note: Ensure your DB column 'ImageUrl' is NVARCHAR(MAX)
            .input('img', sql.NVarChar(sql.MAX), imageBase64) 
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

// --- 3. GET ALL TICKETS ---
exports.getAllTickets = async (req, res) => {
    const { location } = req.query;
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('loc', sql.NVarChar, location || '').query("SELECT * FROM SafetyTickets WHERE Location = @loc ORDER BY CreatedAt DESC");
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- 4. GET TECHNICIANS ---
exports.getTechnicians = async (req, res) => {
    const { location } = req.query;
    try {
        const pool = await poolPromise; 
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

// --- 5. ASSIGN TICKET ---
exports.assignTicket = async (req, res) => {
    const { ticketId, techId, techName, plannerName } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('tid', sql.Int, ticketId)
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
        console.error("Assign Error:", err); 
        res.status(500).json({ message: err.message });
    }
};

// --- 6. UPDATE STATUS ---
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