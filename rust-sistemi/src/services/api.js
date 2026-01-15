// API Service - Web Only Version
// Tauri dependencies removed

// Configuration
const API_BASE_URL = "https://rust-api-xqiw.onrender.com/api";

// Compatibility Helpers
export const isTauri = () => false; // Standalone export for legacy imports

// Cache Management
const cache = new Map();
const CACHE_TTL = 8000; // 8 seconds cache for frequent lists

const getWithCache = async (key, fetcher, useCache = true) => {
    if (!useCache) return fetcher();
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
        return cached.data;
    }
    const data = await fetcher();
    cache.set(key, { data, timestamp: now });
    return data;
};

// Error Helper
const handleErr = (err) => {
    console.error("API Error:", err);
    throw err;
};

export const api = {
    API_URL: API_BASE_URL,

    isTauri: () => false, // Always web

    // Helper for Image URLs
    getImageUrl: (path) => {
        if (!path) return null;
        if (path.startsWith('data:')) return path;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL.replace('/api', '')}/${path}`;
    },

    debug: () => {
        console.log("API Service: Web Mode Connected to", API_BASE_URL);
    },

    checkHealth: async () => {
        const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
        try {
            const response = await fetch(`${baseUrl}/`);
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            return true;
        } catch (e) {
            console.error("Health Check Failed:", e);
            throw e;
        }
    },

    // --- Core Request Method ---
    request: async (method, endpoint, body = null, headers = {}) => {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenant_id');

        const finalHeaders = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...(tenantId && { 'X-Tenant-ID': tenantId }),
            ...headers
        };

        const config = {
            method,
            headers: finalHeaders,
            credentials: 'include', // Send cookies
            ...(body && { body: JSON.stringify(body) })
        };

        console.log(`📡 ${method} ${url}`);

        try {
            const response = await fetch(url, config);

            // Handle Unauthorized
            if (response.status === 401) {
                if (!url.includes('/dictionaries') && !url.includes('/tenants')) {
                    console.warn('🔒 401 Unauthorized - Triggering Logout');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    throw new Error('Unauthorized');
                }
            }

            if (!response.ok) {
                const errorText = await response.text();
                // console.error(`❌ API Error ${response.status}:`, errorText);
                throw new Error(errorText || `API Error: ${response.status}`);
            }

            if (response.status === 204) return null;

            const data = await response.json();
            return data;

        } catch (error) {
            // console.error('❌ Request Failed:', error);
            throw error;
        }
    },

    // Shortcuts
    get: (endpoint) => api.request('GET', endpoint),
    post: (endpoint, body) => api.request('POST', endpoint, body),
    put: (endpoint, body) => api.request('PUT', endpoint, body),
    del: (endpoint) => api.request('DELETE', endpoint),

    // --- Auth & Tenant ---
    searchTenants: async (term) => api.get(`/tenants/search/${encodeURIComponent(term)}`),

    loadActiveTenant: async () => {
        const tenantStr = localStorage.getItem('saved_tenant');
        if (tenantStr) {
            try { return JSON.parse(tenantStr); } catch (e) { }
        }
        return null;
    },

    setActiveTenant: async (tenantId) => {
        if (tenantId) localStorage.setItem('tenant_id', tenantId);
        return Promise.resolve();
    },

    setAuthState: async () => Promise.resolve(), // No-op for web

    setupNewCompany: async (companyName, connectionString) => "mock-new-id-web",

    loginUser: async (username, password) => {
        return api.post('/login', { username, password })
            .then(res => {
                if (res && res.success && res.user) {
                    if (res.user.is_active === false) {
                        return { success: false, message: "Hesabınız admin təsdiqi gözləyir." };
                    }
                    localStorage.setItem('user', JSON.stringify(res.user));
                    if (res.token) localStorage.setItem('token', res.token);
                }
                return res;
            });
    },

    getCurrentUser: () => {
        try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; }
    },

    updateLocalUser: (userData) => {
        const currentUser = api.getCurrentUser();
        if (currentUser && userData) {
            const updated = { ...currentUser, ...userData };
            updated.id = currentUser.id;
            localStorage.setItem('user', JSON.stringify(updated));
            window.dispatchEvent(new Event('storage'));
        }
    },

    registerUser: async (userData) => api.post('/register', userData),

    logout: async () => {
        const tenantId = localStorage.getItem('tenant_id');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        try {
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', ...(tenantId && { 'X-Tenant-ID': tenantId }) },
                body: JSON.stringify({})
            });
        } catch (e) { }
    },

    // --- Employee ---
    getEmployees: async (useCache = true) => getWithCache('employees', () => api.get('/employees'), useCache),

    getEmployeeById: async (id) => api.get(`/employees/${id}`),

    getFullEmployeeDetails: async (id) => {
        // Client-side aggregation
        const [employee, vacations] = await Promise.all([
            api.get(`/employees/${id}`),
            api.get(`/vacations/employee/${id}`)
        ]);

        let used_paid = 0;
        if (Array.isArray(vacations)) {
            vacations.forEach(v => {
                if (v.status === 'approved') used_paid += (v.days_count || 0);
            });
        }

        return {
            employee,
            vacations: Array.isArray(vacations) ? vacations : [],
            stats: {
                total_days_given: employee.total_vacation_days || 30,
                used_paid,
                used_unpaid: 0,
                used_sick: 0,
                remaining: (employee.total_vacation_days || 30) - used_paid
            }
        };
    },

    getMyProfile: async () => {
        const user = api.getCurrentUser();
        if (!user) return null;
        return api.get(`/employees/${user.id}`);
    },

    updateProfile: (data) => api.put('/profile', data),
    changePassword: (oldP, newP) => api.post('/profile/password', { old_password: oldP, new_password: newP }),
    uploadProfileImage: (b64) => api.post('/profile/image', { image: b64 }),
    deleteProfileImage: () => api.del('/profile/image'),

    // --- Admin ---
    adminUpdateEmployee: (id, data) => api.put(`/admin/employees/${id}`, data),
    adminChangePassword: (id, newP) => api.post(`/admin/employees/${id}/password`, { new_password: newP }),
    createEmployee: (data) => api.post('/employees', data),
    updateEmployee: (id, data) => api.put(`/admin/employees/${id}`, data),
    toggleEmployeeActive: (id, active) => api.put(`/employees/${id}/active`, { active }),

    // --- Vacation ---
    getVacations: (empId) => api.get(`/vacations/employee/${empId}`),
    createVacation: (data) => api.post('/vacations', data),
    deleteVacation: (id) => api.del(`/vacations/${id}`),
    updateVacationStatus: (id, status) => api.put(`/vacations/${id}`, { status }),
    updateVacation: (id, data) => api.put(`/vacations/${id}/details`, data),

    // Notifications
    getNotifications: (rId) => api.get(`/notifications${rId ? '?recipientId=' + rId : ''}`),
    markNotificationRead: (id) => api.put(`/notifications/${id}/read`, {}),
    deleteNotification: (id) => api.del(`/notifications/${id}`),
    syncNotifications: () => api.post('/notifications/sync', {}),

    getVacationStats: async (employeeId, preFetchedData = {}) => {
        try {
            const vacations = preFetchedData.vacations || await api.get(`/vacations/employee/${employeeId}`);
            const employee = preFetchedData.employee || await api.get(`/employees/${employeeId}`);

            let used_paid = 0;
            if (Array.isArray(vacations)) {
                vacations.forEach(v => {
                    if (v.status === 'approved') used_paid += (v.days_count || 0);
                });
            }
            const total = employee.total_vacation_days || 30;
            return {
                total_days_given: total,
                used_paid,
                remaining: total - used_paid
            };
        } catch (e) {
            return { total_days_given: 30, used_paid: 0, remaining: 30 };
        }
    },

    getAllVacations: () => api.get('/vacations'),

    // --- Security & Dictionaries ---
    getBlockedIps: () => api.get('/admin/ip/list'),
    getLoginHistory: () => api.get('/admin/history'),
    blockIp: (ip, reason) => api.post('/admin/ip/block', { ip, reason }),
    unblockIp: (ip) => api.request('DELETE', '/admin/ip/unblock', { ip }),

    getArchivePreview: (year) => api.get(`/admin/archive/preview?year=${year}`),
    getArchiveHistory: (year) => api.get(`/admin/archive/history?year=${year}`),
    archiveVacations: (data) => api.post('/admin/archive', data),

    getDashboardStats: (useCache = true) => getWithCache('dashboard_stats', () => api.get('/dashboard/stats'), useCache),

    getDepartments: () => api.get('/dictionaries/departments'),
    addDepartment: (name) => api.post('/dictionaries/departments', { name }),
    deleteDepartment: (id) => api.request('DELETE', `/dictionaries/departments/${id}`),
    updateDepartment: (id, name) => api.put(`/dictionaries/departments/${id}`, { name }),

    getPositions: () => api.get('/dictionaries/positions'),
    addPosition: (name) => api.post('/dictionaries/positions', { name }),
    deletePosition: (id) => api.request('DELETE', `/dictionaries/positions/${id}`),
    updatePosition: (id, name) => api.put(`/dictionaries/positions/${id}`, { name }),

    // --- Chat ---
    chat: {
        getActiveFriends: (useCache = true) => getWithCache('chat_friends', () => api.get('/chat/friends'), useCache),
        getFriendRequests: () => api.get('/chat/requests'),
        requestFriendship: (targetId) => api.post('/chat/requests', { target_id: targetId }),
        respondFriendship: (requestId, action) => api.put(`/chat/requests/${requestId}`, { action }),
        getAllUsersForChat: (useCache = true) => getWithCache('chat_users', () => api.get('/chat/users'), useCache),

        getMessages: (friendId, page = 1, limit = 50) => api.get(`/chat/messages/${friendId}?page=${page}&limit=${limit}`),

        sendMessage: (recipientId, message, replyToId, attachmentPath, attachmentType) => {
            const payload = { recipient_id: recipientId, message, reply_to_id: replyToId, attachment_path: attachmentPath, attachment_type: attachmentType };
            return api.post('/chat/messages', payload);
        },
        removeFriend: (friendId) => api.del(`/chat/friends/${friendId}`),
        deleteMessage: (messageId, deleteForEveryone) => api.post('/chat/messages/delete', { message_id: messageId, delete_for_everyone: deleteForEveryone }),
        clearChat: (friendId, deleteForEveryone) => api.post('/chat/history/clear', { friend_id: friendId, delete_for_everyone: deleteForEveryone }),
        markRead: (friendId) => api.put(`/chat/messages/${friendId}/read`, {}),
        markMessagesRead: (friendId) => api.put(`/chat/messages/${friendId}/read`, {}), // Alias for backward compatibility
    },

    // System Error
    reportSystemError: (data) => api.post('/report-error', data).catch(() => { }),
    getSystemErrors: () => api.get('/admin/errors'),
    resolveSystemError: (id) => api.del(`/admin/errors/${id}`),
    resolveAllSystemErrors: () => api.del('/admin/errors/all'),
};

export default api;
