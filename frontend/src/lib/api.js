const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Security: Auto-logout on 401 Unauthorized
const handleUnauthorized = () => {
  // Clear local storage
  localStorage.removeItem('merit-auth-storage');

  // Redirect to home/login page
  if (window.location.pathname !== '/' && !window.location.pathname.includes('/auth')) {
    window.location.href = '/';
  }
};

// Security: Sanitize request body to prevent XSS in API calls
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Remove potential script tags and dangerous patterns
      sanitized[key] = value
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const api = {
  request: async (endpoint, method = 'GET', body = null, token = null) => {
    const headers = {
      'Content-Type': 'application/json',
      // Security: Prevent MIME type sniffing
      'Accept': 'application/json'
    };

    if (token) {
      // Validate token format before sending
      if (typeof token !== 'string' || token.length < 10) {
        console.warn('Invalid token format detected');
        handleUnauthorized();
        throw new Error('Invalid authentication token');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers,
      // Security: Include credentials for secure cookie handling
      credentials: 'include'
    };

    if (body) {
      // Sanitize body before sending
      config.body = JSON.stringify(sanitizeObject(body));
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);

      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        console.warn('Failed to parse error response as JSON');
      }

      const serverError = data.error || data.message;
      const isLoginRoute = endpoint.includes('/login');

      // Handle 401 Unauthorized
      if (response.status === 401) {
        if (isLoginRoute) {
          throw new Error(serverError || 'Invalid credentials. Please check your email and password.');
        }
        console.warn('Session expired or invalid token');
        handleUnauthorized();
        throw new Error(serverError || 'Session expired. Please log in again.');
      }

      // Handle 403 Forbidden
      if (response.status === 403) {
        if (isLoginRoute) {
          throw new Error(serverError || 'Access Denied: You do not have permission to access this area.');
        }
        throw new Error(serverError || 'Access denied. You do not have permission to perform this action.');
      }

      // Handle 429 Too Many Requests
      if (response.status === 429) {
        throw new Error(serverError || 'Too many requests. Please slow down and try again later.');
      }

      if (!response.ok) {
        // For 500 errors, prefer the server message if it looks like a suspension message
        if (response.status === 500 && serverError?.toLowerCase().includes('suspended')) {
          throw new Error(serverError);
        }
        throw new Error(serverError || `Server Error (${response.status})`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  post: (endpoint, body, token) => api.request(endpoint, 'POST', body, token),
  get: (endpoint, token) => api.request(endpoint, 'GET', null, token),
  put: (endpoint, body, token) => api.request(endpoint, 'PUT', body, token),
  delete: (endpoint, token) => api.request(endpoint, 'DELETE', null, token),
};
