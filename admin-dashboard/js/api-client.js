// 💃 Dancify Admin Dashboard - API Client
// Handles all communication with the Dancify backend
// RESTful API integration for dance moves, styles, and submissions

class DancifyAPI {
    constructor() {
        // API Configuration - Update with your actual backend URL
        this.baseURL = 'https://dancify-backend-production.up.railway.app/api';
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
            console.warn('⚠️ API connection failed during init:', error.message);
            // Don't throw - allow app to work in offline mode
        }
    }

    // 🏓 Ping endpoint to test connection
    async ping() {
        try {
            const response = await this.request('GET', '/health');
            return response.status === 'ok';
        } catch (error) {
            throw new Error('API connection failed');
        }
    }

    // 🔐 Authentication methods
    loadAuthTokens() {
        this.authToken = localStorage.getItem('dancify_auth_token');
        this.refreshToken = localStorage.getItem('dancify_refresh_token');
    }

    saveAuthTokens(authToken, refreshToken) {
        this.authToken = authToken;
        this.refreshToken = refreshToken;
        localStorage.setItem('dancify_auth_token', authToken);
        if (refreshToken) {
            localStorage.setItem('dancify_refresh_token', refreshToken);
        }
    }

    clearAuthTokens() {
        this.authToken = null;
        this.refreshToken = null;
        localStorage.removeItem('dancify_auth_token');
        localStorage.removeItem('dancify_refresh_token');
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
            throw this.handleError(error, endpoint);
        }
    }

    // 🔄 Fetch with retry logic
    async fetchWithRetry(url, config, attempt = 1) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);
            
            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
            
        } catch (error) {
            if (attempt < this.retryAttempts && this.shouldRetry(error)) {
                console.warn(`🔄 Retrying request (${attempt}/${this.retryAttempts}): ${url}`);
                await this.delay(this.retryDelay * attempt);
                return this.fetchWithRetry(url, config, attempt + 1);
            }
            throw error;
        }
    }

    // 📤 Handle API response
    async handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new APIError(
                errorData.message || `HTTP ${response.status}`,
                response.status,
                errorData
            );
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return { success: true, data: await response.text() };
    }

    // 💥 Error handling
    handleError(error, endpoint) {
        if (error instanceof APIError) {
            // Handle specific API errors
            if (error.status === 401) {
                this.handleUnauthorized();
            }
            return error;
        }
        
        if (error.name === 'AbortError') {
            return new APIError('Request timeout', 408);
        }
        
        if (!navigator.onLine) {
            return new APIError('No internet connection', 0);
        }
        
        return new APIError(error.message || 'Network error', 500);
    }

    handleUnauthorized() {
        console.warn('🔐 Unauthorized - clearing auth tokens');
        this.clearAuthTokens();
        // Redirect to login or show auth modal
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
        return this.request('GET', '/admin/dashboard/charts');
    }

    async getRecentActivity() {
        return this.request('GET', '/admin/dashboard/activity');
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

    // 🎭 Dance style API methods
    async getDanceStyles() {
        return this.request('GET', '/admin/dance-styles');
    }

    async getDanceStyle(styleId) {
        return this.request('GET', `/admin/dance-styles/${styleId}`);
    }

    async createDanceStyle(styleData) {
        return this.request('POST', '/admin/dance-styles', styleData);
    }

    async updateDanceStyle(styleId, styleData) {
        return this.request('PUT', `/admin/dance-styles/${styleId}`, styleData);
    }

    async deleteDanceStyle(styleId) {
        return this.request('DELETE', `/admin/dance-styles/${styleId}`);
    }

    // 📂 Categories and sections API methods
    async getCategories(danceStyle) {
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
        const endpoint = queryParams ? `/admin/feedback?${queryParams}` : '/admin/feedback';
        return this.request('GET', endpoint);
    }

    async markFeedbackAsRead(feedbackId) {
        return this.request('POST', `/admin/feedback/${feedbackId}/mark-read`);
    }

    // 📱 Social posts API methods
    async getSocialPosts(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? 
            `/admin/social-posts?${queryParams}` : 
            '/admin/social-posts';
        return this.request('GET', endpoint);
    }

    async moderateSocialPost(postId, action, reason = '') {
        return this.request('POST', `/admin/social-posts/${postId}/moderate`, { action, reason });
    }

    // 📈 Analytics and reports API methods
    async getAnalytics(period = '7d') {
        return this.request('GET', `/admin/analytics?period=${period}`);
    }

    async getReports(type, filters = {}) {
        const queryParams = new URLSearchParams({ type, ...filters }).toString();
        return this.request('GET', `/admin/reports?${queryParams}`);
    }

    async exportData(type, format = 'csv') {
        const endpoint = `/admin/export/${type}?format=${format}`;
        return this.request('GET', endpoint);
    }

    // ⚙️ Settings API methods
    async getSettings() {
        return this.request('GET', '/admin/settings');
    }

    async updateSettings(settings) {
        return this.request('PUT', '/admin/settings', settings);
    }

    // 🧹 Cleanup method
    cleanup() {
        this.clearCache();
        console.log('🧹 API client cleanup completed');
    }
}

// 💥 Custom API Error class
class APIError extends Error {
    constructor(message, status = 500, details = {}) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.details = details;
    }
}

// 🔧 Utility functions
const APIUtils = {
    // Format file size for uploads
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // Validate video URL
    isValidVideoURL(url) {
        const videoPatterns = [
            /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/,
            /^https?:\/\/(www\.)?vimeo\.com\/.+$/,
            /^https?:\/\/.+\.(mp4|webm|ogg)$/
        ];
        return videoPatterns.some(pattern => pattern.test(url));
    },
    
    // Extract YouTube video ID
    extractYouTubeID(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    },
    
    // Generate thumbnail URL for YouTube videos
    getYouTubeThumbnail(videoId, quality = 'hqdefault') {
        return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
    },
    
    // Debounce function for search inputs
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// 🌐 Export for global use
window.DancifyAPI = DancifyAPI;
window.APIError = APIError;
window.APIUtils = APIUtils;

console.log('🔗 Dancify API client loaded');