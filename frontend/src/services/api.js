import axios from 'axios';
import { API_BASE_URL } from '../config'; // Import from central config

// Construct Endpoints
const AUTH_URL = `${API_BASE_URL}/auth`;
const FACILITY_URL = `${API_BASE_URL}/facility`;
const ADMIN_URL = `${API_BASE_URL}/admin`;

// Helper to get Auth Header
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- AUTHENTICATION API ---
export const api = {
    // 1. Verify ID
    verifyID: async (globalId) => {
        const res = await axios.post(`${AUTH_URL}/verify`, { globalId });
        return res.data;
    },

    // 2. Activate Account
    activate: async (data) => {
        const res = await axios.post(`${AUTH_URL}/activate`, data);
        return res.data;
    },

    // 3. Login Function (Normalized)
    login: async (credentials) => {
        try {
            const res = await axios.post(`${AUTH_URL}/login`, credentials);
            const data = res.data;

            // Normalize User Object
            const rawUser = data.user;
            const normalizedUser = {
                ...rawUser,
                id: rawUser.GlobalID || rawUser.id,
                name: rawUser.FullName || rawUser.Name || rawUser.name,
                location: rawUser.PlantLocation || rawUser.Location || rawUser.location,
                email: rawUser.Email || rawUser.email,
                profileImage: rawUser.ProfileImage
            };

            return { success: true, data: { token: data.token, user: normalizedUser } };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            return { success: false, message };
        }
    },

    // 4. Get Permissions
    getPermissions: async (globalId) => {
        const res = await axios.get(`${AUTH_URL}/permissions/${globalId}`);
        return res.data;
    },

    // 5. Update Profile Picture
    updateProfilePic: async (data) => {
        const res = await axios.post(`${AUTH_URL}/update-profile-pic`, data);
        return res.data;
    }
};

// --- FACILITY API ---
export const facilityApi = {
    getDropdownData: async (location) => {
        const res = await axios.get(`${FACILITY_URL}/dropdowns`, { 
            params: { location },
            headers: getAuthHeaders() 
        });
        return res.data;
    },
    getTechnicians: async (location) => {
        const res = await axios.get(`${FACILITY_URL}/technicians`, { 
            params: { location },
            headers: getAuthHeaders() 
        });
        return res.data;
    },
    createTicket: async (ticketData) => {
        const res = await axios.post(`${FACILITY_URL}/tickets`, ticketData, { 
            headers: getAuthHeaders() 
        });
        return res.data;
    },
    getAllTickets: async (location) => {
        const res = await axios.get(`${FACILITY_URL}/tickets`, { 
            params: { location },
            headers: getAuthHeaders() 
        });
        return res.data;
    },
    assignTicket: async (data) => {
        const res = await axios.post(`${FACILITY_URL}/assign`, data, { 
            headers: getAuthHeaders() 
        });
        return res.data;
    },
    updateStatus: async (data) => {
        const res = await axios.post(`${FACILITY_URL}/status`, data, { 
            headers: getAuthHeaders() 
        });
        return res.data;
    },
    deleteTicket: async (ticketId) => {
        const res = await axios.delete(`${FACILITY_URL}/tickets/${ticketId}`, { 
            headers: getAuthHeaders() 
        });
        return res.data;
    },
    
    /* Master Data */
    addBuilding: async (data) => {
        const res = await axios.post(`${FACILITY_URL}/master/building`, data, { headers: getAuthHeaders() });
        return res.data;
    },
    deleteBuilding: async (id) => {
        const res = await axios.delete(`${FACILITY_URL}/master/building/${id}`, { headers: getAuthHeaders() });
        return res.data;
    },
    addArea: async (data) => {
        const res = await axios.post(`${FACILITY_URL}/master/area`, data, { headers: getAuthHeaders() });
        return res.data;
    },
    deleteArea: async (id) => {
        const res = await axios.delete(`${FACILITY_URL}/master/area/${id}`, { headers: getAuthHeaders() });
        return res.data;
    },
    addSubArea: async (data) => {
        const res = await axios.post(`${FACILITY_URL}/master/subarea`, data, { headers: getAuthHeaders() });
        return res.data;
    },
    deleteSubArea: async (areaId, name) => {
        // Axios delete with body requires 'data' property
        const res = await axios.delete(`${FACILITY_URL}/master/subarea`, { 
            headers: getAuthHeaders(),
            data: { areaId, name } 
        });
        return res.data;
    },
    addKeyword: async (data) => {
        const res = await axios.post(`${FACILITY_URL}/master/keyword`, data, { headers: getAuthHeaders() });
        return res.data;
    },
    deleteKeyword: async (name) => {
        const res = await axios.delete(`${FACILITY_URL}/master/keyword/${name}`, { headers: getAuthHeaders() });
        return res.data;
    },
};

// --- ADMIN API ---
export const adminApi = {
    getEmployees: async (adminId) => {
        const res = await axios.get(`${ADMIN_URL}/employees`, { 
            params: { adminId },
            headers: getAuthHeaders()
        });
        return res.data;
    },
    addEmployee: async (empData) => {
        const res = await axios.post(`${ADMIN_URL}/employees`, empData, { 
            headers: getAuthHeaders() 
        });
        return res.data;
    },
    updateAccess: async (data) => {
        const res = await axios.post(`${ADMIN_URL}/access`, data, { 
            headers: getAuthHeaders() 
        });
        return res.data;
    }
};