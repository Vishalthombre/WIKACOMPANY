// src/services/api.js

// ⚠️ IMPORTANT: Port must be 5000 to match your Node.js server
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const API_URL = `${BASE_URL}/auth`;
const FACILITY_URL = `${BASE_URL}/facility`;
const ADMIN_URL = `${BASE_URL}/admin`;

export const api = {
    // 1. Verify ID
    verifyID: async (globalId) => {
        const response = await fetch(`${API_URL}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ globalId })
        });
        return await response.json();
    },

    // 2. Activate Account
    activate: async (data) => {
        const response = await fetch(`${API_URL}/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return await response.json();
    },

    // 3. Login Function (Normalized)
    login: async (credentials) => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        const data = await response.json();
        
        if (response.ok) {
            const rawUser = data.user;
            const normalizedUser = {
                ...rawUser,
                id: rawUser.GlobalID || rawUser.id,
                name: rawUser.FullName || rawUser.Name || rawUser.name,
                location: rawUser.PlantLocation || rawUser.Location || rawUser.location,
                email: rawUser.Email || rawUser.email,
                profileImage: rawUser.ProfileImage // Ensure image is passed through
            };

            return { success: true, data: { token: data.token, user: normalizedUser } };
        } else {
            return { success: false, message: data.message };
        }
    },

    // 4. Get Permissions
    getPermissions: async (globalId) => {
        const response = await fetch(`${API_URL}/permissions/${globalId}`);
        if (!response.ok) throw new Error('Failed to fetch permissions');
        return await response.json();
    },

    // ✅ 5. NEW: Update Profile Picture
    updateProfilePic: async (data) => {
        const response = await fetch(`${API_URL}/update-profile-pic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    }
};

export const facilityApi = {
    getDropdownData: async (location) => {
        const res = await fetch(`${FACILITY_URL}/dropdowns?location=${location}`);
        return await res.json();
    },
    getTechnicians: async (location) => {
        const res = await fetch(`${FACILITY_URL}/technicians?location=${location}`);
        return await res.json();
    },
    createTicket: async (ticketData) => {
        const res = await fetch(`${FACILITY_URL}/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticketData)
        });
        return await res.json();
    },
    getAllTickets: async (location) => {
        const res = await fetch(`${FACILITY_URL}/tickets?location=${location}`);
        return await res.json();
    },
    assignTicket: async (data) => {
        const res = await fetch(`${FACILITY_URL}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },
    updateStatus: async (data) => {
        const res = await fetch(`${FACILITY_URL}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },
    deleteTicket: async (ticketId) => {
        const res = await fetch(`${FACILITY_URL}/tickets/${ticketId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        return await res.json();
    },
    /* Master Data */
    addBuilding: async (data) => {
        const res = await fetch(`${FACILITY_URL}/master/building`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        return await res.json();
    },
    deleteBuilding: async (id) => {
        const res = await fetch(`${FACILITY_URL}/master/building/${id}`, { method: 'DELETE' });
        return await res.json();
    },
    addArea: async (data) => {
        const res = await fetch(`${FACILITY_URL}/master/area`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        return await res.json();
    },
    deleteArea: async (id) => {
        const res = await fetch(`${FACILITY_URL}/master/area/${id}`, { method: 'DELETE' });
        return await res.json();
    },
    addSubArea: async (data) => {
        const res = await fetch(`${FACILITY_URL}/master/subarea`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        return await res.json();
    },
    deleteSubArea: async (areaId, name) => {
        const res = await fetch(`${FACILITY_URL}/master/subarea`, { method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({areaId, name}) });
        return await res.json();
    },
    addKeyword: async (data) => {
        const res = await fetch(`${FACILITY_URL}/master/keyword`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        return await res.json();
    },
    deleteKeyword: async (name) => {
        const res = await fetch(`${FACILITY_URL}/master/keyword/${name}`, { method: 'DELETE' });
        return await res.json();
    },
};

export const adminApi = {
    getEmployees: async (adminId) => {
        const res = await fetch(`${ADMIN_URL}/employees?adminId=${adminId}`);
        return await res.json();
    },
    addEmployee: async (empData) => {
        const res = await fetch(`${ADMIN_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(empData)
        });
        return await res.json();
    },
    updateAccess: async (data) => {
        const res = await fetch(`${ADMIN_URL}/access`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    }
};