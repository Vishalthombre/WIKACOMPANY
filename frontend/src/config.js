// 1. Get the URL from .env (e.g., http://localhost:5000/api)
const ENV_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 2. API_BASE_URL: Always ensure it includes /api
// If your .env missed it, this adds it. If it's there, it keeps it.
export const API_BASE_URL = ENV_URL.endsWith('/api') ? ENV_URL : `${ENV_URL}/api`;

// 3. IMAGE_BASE_URL: We need the ROOT domain for images (Remove /api)
// Converts "http://localhost:5000/api" -> "http://localhost:5000"
export const IMAGE_BASE_URL = API_BASE_URL.replace('/api', '');