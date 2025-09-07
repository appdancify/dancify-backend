// 💃 Dancify Admin Dashboard - API Client
// Handles all communication with the Dancify backend
// RESTful API integration for dance moves, styles, and submissions

class DancifyAPI {
    constructor() {
        // API Configuration - Auto-detect the correct backend URL
        this.baseURL = this.detectBackendURL();
        this.timeout = 30000; // 30 seconds
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
        
        // Request cache for optimization
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Authentication state
        this.authToken = null;
        this.refreshToken = null;
        
        // Request interceptors
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        
        console.log(`🔗 API Client configured for: ${this.baseURL}`);
    }

    // 🔍 Auto-detect the correct backend URL
    detectBackendURL() {
        const currentHost = window.location.hostname;
        
        // If we're on the same domain (Render deployment), use relative URLs
        if (currentHost.includes('onrender.com')) {
            return window.location.origin + '/api';
        }
        
        // For localhost development
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            return 'http://localhost:3001/api';
        }
        
        // Fallback to environment variable or default
        return window.DANCIFY_API_URL || window.location.origin + '/api';
    }

    // 🚀 Initialize API client
    async init() {
        try {
            console.log('🔗 Initializing Dancify API client...');
            
            // Load stored auth tokens
            this.loadAuthTokens();
            
            // Test connection
            await this.ping();
            console.log('✅ API client initialized successfully');
            
        } catch (error) {
            console.error('❌ API client initialization failed:', error);
            throw new Error('Failed to initialize API client: ' + error.message);
        }
    }

    // 🏓 Test connection to backend
    async ping() {
        try {
            const response = await this.request('GET', '/health');
            console.log('✅ Backend connection successful');
            return response;
        } catch (error) {
            console.error('❌ Backend connection failed:', error);
            throw error;
        }
    }

    // 🔐 Authentication methods
    loadAuthTokens() {
        try {
            this.authToken = localStorage.getItem('dancify_auth_token');
            this.refreshToken = localStorage.getItem('dancify_refresh_token');
        } catch (error) {
            console.warn('⚠️ Could not load auth tokens from localStorage');
        }
    }

    saveAuthTokens(authToken, refreshToken) {
        try {
            this.authToken = authToken;
            this.refreshToken = refreshToken;
            
            if (authToken) {
                localStorage.setItem('dancify_auth_token', authToken);
            }
            if (refreshToken) {
                localStorage.setItem('dancify_refresh_token', refreshToken);
            }
        } catch (error) {
            console.warn('⚠️ Could not save auth tokens to localStorage');
        }
    }

    clearAuthTokens() {
        this.authToken = null;
        this.refreshToken = null;
        try {
            localStorage.removeItem('dancify_auth_token');
            localStorage.removeItem('dancify_refresh_token');
        } catch (error) {
            console.warn('⚠️ Could not clear auth tokens from localStorage');
        }
    }

    // 🌐 Core HTTP request method
    async request(method, endpoint, data = null, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const cacheKey = `${method}:${endpoint}`;
        
        // Check cache for GET requests
        if (method === 'GET' && !options.skipCache) {
            const cached = this.getCachedResponse(cacheKey);
            if (cached) {
                console.log(`📋 Using cached response for ${endpoint}`);
                return cached;
            }
        }
        
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
                ...options.headers
            },
            timeout: options.timeout || this.timeout
        };
        
        if (data) {
            config.body = JSON.stringify(data);
        }
        
        try {
            const response = await this.fetchWithRetry(url, config);
            const result = await this.handleResponse(response);
            
            // Cache successful GET responses
            if (method === 'GET' && result.success) {
                this.setCachedResponse(cacheKey, result);
            }
            
            return result;
            
        } catch (error) {
            console.error(`❌ API request failed: ${method} ${endpoint}`, error);
            throw error;
        }
    }

    // 🔄 Fetch with retry logic
    async fetchWithRetry(url, config, attempt = 1) {
        try {
            console.log(`🌐 ${config.method} ${url} (attempt ${attempt})`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);
            
            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
            
        } catch (error) {
            console.error(`❌ Fetch attempt ${attempt} failed:`, error.message);
            
            if (attempt < this.retryAttempts && this.shouldRetry(error)) {
                console.log(`🔄 Retrying in ${this.retryDelay}ms...`);
                await this.delay(this.retryDelay);
                return this.fetchWithRetry(url, config, attempt + 1);
            }
            
            throw this.createNetworkError(error);
        }
    }

    // 📦 Handle HTTP response
    async handleResponse(response) {
        let result;
        
        try {
            const textContent = await response.text();
            result = textContent ? JSON.parse(textContent) : {};
        } catch (error) {
            throw new APIError('Invalid JSON response', response.status);
        }
        
        if (!response.ok) {
            const errorMessage = result.error || result.message || `HTTP ${response.status}`;
            
            if (response.status === 401) {
                this.handleUnauthorized();
            }
            
            throw new APIError(errorMessage, response.status, result);
        }
        
        return result;
    }

    // ⚠️ Create network error
    createNetworkError(error) {
        if (error.name === 'AbortError') {
            return new APIError('Request timeout', 408);
        }
        
        if (!navigator.onLine) {
            return new APIError('No internet connection', 0);
        }
        
        return new APIError(error.message || 'Network error', 500);
    }

    // 🔐 Handle unauthorized access
    handleUnauthorized() {
        console.warn('🔐 Unauthorized - clearing auth tokens');
        this.clearAuthTokens();
        // Dispatch event for components to handle
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    // 🎯 Helper methods
    getAuthHeaders() {
        const headers = {};
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        return headers;
    }

    shouldRetry(error) {
        // Retry on network errors, timeouts, and 5xx status codes
        return (
            error.name === 'AbortError' ||
            error.name === 'TypeError' ||
            (error instanceof APIError && error.status >= 500)
        );
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 📋 Cache management
    getCachedResponse(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCachedResponse(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    // 📊 Dashboard API methods
    async getDashboardStats() {
        return this.request('GET', '/admin/dashboard');
    }

    async getDashboardCharts() {
        return this.request('GET', '/admin/analytics');
    }

    async getRecentActivity() {
        return this.request('GET', '/admin/dashboard');
    }

    // 👥 User management API methods
    async getUsers(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/admin/users?${queryParams}` : '/admin/users';
        return this.request('GET', endpoint);
    }

    async getUser(userId) {
        return this.request('GET', `/admin/users/${userId}`);
    }

    async updateUser(userId, userData) {
        return this.request('PUT', `/admin/users/${userId}`, userData);
    }

    async deleteUser(userId) {
        return this.request('DELETE', `/admin/users/${userId}`);
    }

    async createUser(userData) {
        return this.request('POST', '/admin/users', userData);
    }

    // 🕺 Dance move API methods
    async getMoves(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/admin/moves?${queryParams}` : '/admin/moves';
        return this.request('GET', endpoint);
    }

    async getMove(moveId) {
        return this.request('GET', `/admin/moves/${moveId}`);
    }

    async createMove(moveData) {
        return this.request('POST', '/admin/moves', moveData);
    }

    async updateMove(moveId, moveData) {
        return this.request('PUT', `/admin/moves/${moveId}`, moveData);
    }

    async deleteMove(moveId) {
        return this.request('DELETE', `/admin/moves/${moveId}`);
    }

    // 🎭 Dance style API methods - FIXED to use correct endpoints
    async getDanceStyles(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/dance-styles?${queryParams}` : '/dance-styles';
        return this.request('GET', endpoint);
    }

    async getDanceStyle(styleId) {
        return this.request('GET', `/dance-styles/${styleId}`);
    }

    async createDanceStyle(styleData) {
        return this.request('POST', '/dance-styles', styleData);
    }

    async updateDanceStyle(styleId, styleData) {
        return this.request('PUT', `/dance-styles/${styleId}`, styleData);
    }

    async deleteDanceStyle(styleId) {
        return this.request('DELETE', `/dance-styles/${styleId}`);
    }

    async getCategories(danceStyle = null) {
        const endpoint = danceStyle ? 
            `/admin/categories?dance_style=${encodeURIComponent(danceStyle)}` : 
            '/admin/categories';
        return this.request('GET', endpoint);
    }

    async getSubcategories(danceStyle, category) {
        const params = new URLSearchParams({ dance_style: danceStyle, category });
        return this.request('GET', `/admin/subcategories?${params}`);
    }

    // 📹 Move submission API methods
    async getMoveSubmissions(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? 
            `/admin/move-submissions?${queryParams}` : 
            '/admin/move-submissions';
        return this.request('GET', endpoint);
    }

    async getMoveSubmission(submissionId) {
        return this.request('GET', `/admin/move-submissions/${submissionId}`);
    }

    async reviewMoveSubmission(submissionId, reviewData) {
        return this.request('POST', `/admin/move-submissions/${submissionId}/review`, reviewData);
    }

    async approveMoveSubmission(submissionId) {
        return this.request('POST', `/admin/move-submissions/${submissionId}/approve`);
    }

    async rejectMoveSubmission(submissionId, reason) {
        return this.request('POST', `/admin/move-submissions/${submissionId}/reject`, { reason });
    }

    // 🎵 Choreography API methods
    async getChoreographies(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? 
            `/admin/choreographies?${queryParams}` : 
            '/admin/choreographies';
        return this.request('GET', endpoint);
    }

    async createChoreography(choreographyData) {
        return this.request('POST', '/admin/choreographies', choreographyData);
    }

    async updateChoreography(choreographyId, choreographyData) {
        return this.request('PUT', `/admin/choreographies/${choreographyId}`, choreographyData);
    }

    async deleteChoreography(choreographyId) {
        return this.request('DELETE', `/admin/choreographies/${choreographyId}`);
    }

    // 🎓 Instructor application API methods
    async getInstructorApplications(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? 
            `/admin/instructor-applications?${queryParams}` : 
            '/admin/instructor-applications';
        return this.request('GET', endpoint);
    }

    async reviewInstructorApplication(applicationId, reviewData) {
        return this.request('POST', `/admin/instructor-applications/${applicationId}/review`, reviewData);
    }

    // 💬 Feedback API methods
    async getFeedback(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? 
            `/admin/feedback?${queryParams}` : 
            '/admin/feedback';
        return this.request('GET', endpoint);
    }

    async updateFeedback(feedbackId, feedbackData) {
        return this.request('PUT', `/admin/feedback/${feedbackId}`, feedbackData);
    }

    async deleteFeedback(feedbackId) {
        return this.request('DELETE', `/admin/feedback/${feedbackId}`);
    }

    // 📱 Social posts API methods  
    async getSocialPosts(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? 
            `/admin/social-posts?${queryParams}` : 
            '/admin/social-posts';
        return this.request('GET', endpoint);
    }

    async createSocialPost(postData) {
        return this.request('POST', '/admin/social-posts', postData);
    }

    async updateSocialPost(postId, postData) {
        return this.request('PUT', `/admin/social-posts/${postId}`, postData);
    }

    async deleteSocialPost(postId) {
        return this.request('DELETE', `/admin/social-posts/${postId}`);
    }
}

// Custom API Error class
class APIError extends Error {
    constructor(message, status, details = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.details = details;
    }
}

// Initialize global API client
window.DancifyAPI = DancifyAPI;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔗 Dancify API client loaded');
});