import axios from 'axios';
import { API_BASE_URL } from '../config'; // Import from config

// Construct the Safety Endpoint: "http://.../api" + "/safety"
const SAFETY_URL = `${API_BASE_URL}/safety`; 

// Helper to get Auth Header
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const safetyApi = {
    // 1. Get Dropdowns
    getDropdownData: async (location) => {
        const res = await axios.get(`${SAFETY_URL}/master-data`, { 
            params: { location },
            headers: getAuthHeaders() 
        });
        return res.data;
    },

    // 2. CREATE TICKET
    createTicket: async (formData) => {
        const res = await axios.post(`${SAFETY_URL}/tickets`, formData, {
            headers: { ...getAuthHeaders() } // Axios handles multipart boundary automatically
        });
        return res.data;
    },

    // 3. Get All Tickets
    getAllTickets: async (location) => {
        const res = await axios.get(`${SAFETY_URL}/tickets`, { 
            params: { location },
            headers: getAuthHeaders()
        });
        return res.data;
    },

    // 4. Assign Ticket
    assignTicket: async (data) => {
        const res = await axios.post(`${SAFETY_URL}/assign`, data, {
            headers: getAuthHeaders()
        });
        return res.data;
    },

    // 5. Update Status
    updateStatus: async (data) => {
        const res = await axios.post(`${SAFETY_URL}/update-status`, data, {
            headers: getAuthHeaders()
        });
        return res.data;
    },

    // 6. Get Technicians
    getTechnicians: async (location) => {
        const res = await axios.get(`${SAFETY_URL}/technicians`, { 
            params: { location },
            headers: getAuthHeaders()
        });
        return res.data;
    },
    
    // 7. Master Data (Admin)
    addHazardType: async (data) => {
        const res = await axios.post(`${SAFETY_URL}/master-data/hazard`, data, {
            headers: getAuthHeaders()
        });
        return res.data;
    },
    
    deleteHazardType: async (name) => {
        const res = await axios.delete(`${SAFETY_URL}/master-data/hazard/${name}`, {
            headers: getAuthHeaders()
        });
        return res.data;
    },

    // 8. Delete Ticket (Added this based on previous request)
    deleteTicket: async (id) => {
        const res = await axios.delete(`${SAFETY_URL}/tickets/${id}`, {
            headers: getAuthHeaders()
        });
        return res.data;
    }
};