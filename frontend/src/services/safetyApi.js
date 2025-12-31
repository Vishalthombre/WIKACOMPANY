import axios from 'axios';

// Ensure this points to your actual backend URL
const API_URL = 'http://localhost:5000/api/safety'; 

// Helper to get Auth Header
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const safetyApi = {
    // 1. Get Dropdowns (Locations, Hazards, etc.)
    getDropdownData: async (location) => {
        const res = await axios.get(`${API_URL}/master-data`, { 
            params: { location },
            headers: getAuthHeaders() 
        });
        return res.data;
    },

    // 2. CREATE TICKET WITH IMAGE
    createTicket: async (formData) => {
        const res = await axios.post(`${API_URL}/tickets`, formData, {
            headers: { 
                ...getAuthHeaders(),
                // NOTE: Do NOT manually set 'Content-Type': 'multipart/form-data' here.
                // Axios automatically sets the correct boundary for FormData.
            }
        });
        return res.data;
    },

    // 3. Get All Tickets
    getAllTickets: async (location) => {
        const res = await axios.get(`${API_URL}/tickets`, { 
            params: { location },
            headers: getAuthHeaders()
        });
        return res.data;
    },

    // 4. Assign Ticket (Planner)
    assignTicket: async (data) => {
        const res = await axios.post(`${API_URL}/assign`, data, {
            headers: getAuthHeaders()
        });
        return res.data;
    },

    // 5. Update Status (Technician)
    updateStatus: async (data) => {
        const res = await axios.post(`${API_URL}/update-status`, data, {
            headers: getAuthHeaders()
        });
        return res.data;
    },

    // 6. Get Safety Technicians
    getTechnicians: async (location) => {
        const res = await axios.get(`${API_URL}/technicians`, { 
            params: { location },
            headers: getAuthHeaders()
        });
        return res.data;
    },
    
    // 7. Master Data Management (Admin)
    addHazardType: async (data) => {
        const res = await axios.post(`${API_URL}/master-data/hazard`, data, {
            headers: getAuthHeaders()
        });
        return res.data;
    },
    
    deleteHazardType: async (id) => {
        const res = await axios.delete(`${API_URL}/master-data/hazard/${id}`, {
            headers: getAuthHeaders()
        });
        return res.data;
    }
};