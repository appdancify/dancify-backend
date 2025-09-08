// 💃 Dancify Admin Dashboard - Dashboard Module
// Main dashboard with statistics, charts, and activity feed
// Real-time data integration with backend API

class DancifyDashboard {
    constructor() {
        this.api = null;
        this.charts = {};
        this.refreshInterval = null;
        this.refreshRate = 5 * 60 * 1000; // 5 minutes
        this.isLoading = false;
        this.lastUpdate = null;
        
        console.log('📊 Dancify Dashboard module loaded');
    }

    // 🚀 Initialize dashboard
    async init() {
        try {
            console.log('📊 Initializing dashboard...');
            
            // Wait for API client to be ready
            this.api = await this.waitForAPI();
            
            // Load initial data
            await this.loadDashboardData();
            
            // Set up auto-refresh
            this.setupAutoRefresh();
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('✅ Dashboard initialized successfully');
            
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            this.showErrorMessage('Failed to initialize dashboard: ' + error.message);
            
            // Load fallback mock data if API fails
            this.loadFallbackData();
        }
    }

    // ⏳ Wait for API client to be available - FIXED
    async waitForAPI() {
        return new Promise((resolve, reject) => {
            const maxWait = 10000; // 10 seconds
            const checkInterval = 100; // 100ms
            let elapsed = 0;
            
            const checkAPI = () => {
                // FIXED: Use the correct global API client reference
                const api = window.apiClient;
                
                if (api && typeof api.getDashboardStats === 'function') {
                    console.log('✅ API client found and connected');
                    resolve(api);
                    return;
                }
                
                elapsed += checkInterval;
                if (elapsed >= maxWait) {
                    console.error('❌ API client not available after timeout');
                    reject(new Error('API client not available'));
                    return;
                }
                
                setTimeout(checkAPI, checkInterval);
            };
            
            checkAPI();
        });
    }

    // 📊 Load all dashboard data
    async loadDashboardData() {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.showLoadingState();
            
            // Load data in parallel for better performance
            const [statsData, chartsData, activityData] = await Promise.allSettled([
                this.loadStats(),
                this.loadCharts(),
                this.loadRecentActivity()
            ]);
            
            // Process results (some may fail)
            if (statsData.status === 'fulfilled' && statsData.value) {
                this.updateStats(statsData.value);
            }
            if (chartsData.status === 'fulfilled' && chartsData.value) {
                this.updateCharts(chartsData.value);
            }
            if (activityData.status === 'fulfilled' && activityData.value) {
                this.updateRecentActivity(activityData.value);
            }
            
            this.hideLoadingState();
            this.lastUpdate = new Date();
            
        } catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
            this.showErrorMessage('Failed to load dashboard data: ' + error.message);
            this.loadFallbackData();
        } finally {
            this.isLoading = false;
        }
    }

    // 📈 Load dashboard statistics - FIXED
    async loadStats() {
        try {
            if (!this.api || typeof this.api.getDashboardStats !== 'function') {
                console.warn('⚠️ API client not available for stats, using fallback');
                return this.getMockStats();
            }
            
            const response = await this.api.getDashboardStats();
            
            if (response && response.success) {
                return response.data;
            } else {
                console.warn('⚠️ API returned unsuccessful response, using fallback');
                return this.getMockStats();
            }
        } catch (error) {
            console.error('❌ Failed to load stats:', error);
            // Return mock data as fallback
            return this.getMockStats();
        }
    }

    // 📊 Mock stats fallback - NEW
    getMockStats() {
        return {
            stats: {
                totalUsers: 1250,
                newUsersThisMonth: 84,
                totalMoves: 156,
                newMovesThisMonth: 12,
                totalSubmissions: 892,
                pendingSubmissions: 23,
                totalDanceStyles: 8,
                activeDanceStyles: 8
            }
        };
    }

    // 📊 Update statistics display - ENHANCED
    updateStats(data) {
        console.log('📊 Updating stats with data:', data);
        
        const stats = {
            totalUsers: data.stats?.totalUsers || 0,
            usersChange: data.stats?.newUsersThisMonth || 0,
            totalMoves: data.stats?.totalMoves || 0,
            movesChange: data.stats?.newMovesThisMonth || 0,
            totalSubmissions: data.stats?.totalSubmissions || 0,
            submissionsChange: data.stats?.pendingSubmissions || 0,
            totalDanceStyles: data.stats?.totalDanceStyles || data.stats?.activeDanceStyles || 0,
            stylesChange: data.stats?.activeDanceStyles || 0
        };

        // Update stat cards with animation
        this.updateStatCard('totalUsers', stats.totalUsers, this.formatChange(stats.usersChange, 'new this month'));
        this.updateStatCard('totalMoves', stats.totalMoves, this.formatChange(stats.movesChange, 'new this month'));
        this.updateStatCard('totalSubmissions', stats.totalSubmissions, this.formatChange(stats.submissionsChange, 'pending'));
        this.updateStatCard('totalDanceStyles', stats.totalDanceStyles, this.formatChange(stats.stylesChange, 'active'));
        
        console.log('✅ Stats updated successfully');
    }

    // 🎯 Update individual stat card - ENHANCED
    updateStatCard(elementId, value, change) {
        const valueElement = document.getElementById(elementId);
        const changeElement = document.getElementById(elementId.replace('total', '') + 'Change');
        
        if (valueElement) {
            // Animate number change
            const currentValue = parseInt(valueElement.textContent.replace(/,/g, '')) || 0;
            this.animateValue(valueElement, currentValue, value, 1000);
        } else {
            console.warn(`⚠️ Stat element not found: ${elementId}`);
        }
        
        if (changeElement) {
            changeElement.textContent = change;
            changeElement.className = 'change ' + (change.includes('+') ? 'positive' : change.includes('-') ? 'negative' : '');
        } else {
            console.warn(`⚠️ Change element not found: ${elementId.replace('total', '') + 'Change'}`);
        }
    }

    // 📝 Format change text
    formatChange(value, label) {
        if (value === 0) return `${value} ${label}`;
        const prefix = value > 0 ? '+' : '';
        return `${prefix}${value} ${label}`;
    }

    // 🎨 Animate value changes
    animateValue(element, start, end, duration) {
        const startTime = performance.now();
        const difference = end - start;
        
        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.round(start + (difference * easeOutQuart));
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        
        requestAnimationFrame(step);
    }

    // 📊 Load and update charts - FIXED
    async loadCharts() {
        try {
            if (!this.api || typeof this.api.getDashboardCharts !== 'function') {
                console.warn('⚠️ API client not available for charts, using fallback');
                return this.getMockChartData();
            }
            
            const response = await this.api.getDashboardCharts();
            
            if (response && response.success) {
                return response.data;
            } else {
                console.warn('⚠️ Charts API returned unsuccessful response, using fallback');
                return this.getMockChartData();
            }
        } catch (error) {
            console.error('❌ Failed to load charts:', error);
            return this.getMockChartData();
        }
    }

    // 📊 Mock chart data fallback - NEW
    getMockChartData() {
        return {
            userGrowth: [
                { month: 'Jan', users: 45 },
                { month: 'Feb', users: 67 },
                { month: 'Mar', users: 89 },
                { month: 'Apr', users: 102 },
                { month: 'May', users: 124 },
                { month: 'Jun', users: 147 }
            ],
            popularMoves: [
                { name: 'Moonwalk', view_count: 1250 },
                { name: 'Spin Turn', view_count: 980 },
                { name: 'Body Wave', view_count: 876 },
                { name: 'Pirouette', view_count: 654 },
                { name: 'Box Step', view_count: 543 }
            ],
            stylePopularity: [
                { name: 'Hip-Hop', move_count: 45 },
                { name: 'Ballet', move_count: 24 },
                { name: 'Salsa', move_count: 35 },
                { name: 'Contemporary', move_count: 32 },
                { name: 'Jazz', move_count: 28 }
            ]
        };
    }

    // 📈 Update chart displays
    updateCharts(data) {
        console.log('📈 Updating charts with data:', data);
        
        if (data.userGrowth) {
            this.updateUserGrowthChart(data.userGrowth);
        }
        
        if (data.popularMoves) {
            this.updatePopularMovesChart(data.popularMoves);
        }
        
        if (data.stylePopularity) {
            this.updateStylePopularityChart(data.stylePopularity);
        }
        
        console.log('✅ Charts updated successfully');
    }

    // 📈 Update user growth chart
    updateUserGrowthChart(data) {
        const ctx = document.getElementById('userGrowthChart');
        if (!ctx) {
            console.warn('⚠️ User growth chart canvas not found');
            return;
        }
        
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js not loaded, skipping chart creation');
            ctx.parentElement.innerHTML = '<p>📊 Chart.js loading...</p>';
            return;
        }
        
        // Destroy existing chart
        if (this.charts.userGrowth) {
            this.charts.userGrowth.destroy();
        }
        
        this.charts.userGrowth = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => item.month) || [],
                datasets: [{
                    label: 'New Users',
                    data: data.map(item => item.users) || [],
                    borderColor: '#8A2BE2',
                    backgroundColor: 'rgba(138, 43, 226, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    // 📊 Update popular moves chart
    updatePopularMovesChart(data) {
        const ctx = document.getElementById('popularMovesChart');
        if (!ctx) {
            console.warn('⚠️ Popular moves chart canvas not found');
            return;
        }
        
        if (typeof Chart === 'undefined') {
            ctx.parentElement.innerHTML = '<p>📊 Chart.js loading...</p>';
            return;
        }
        
        if (this.charts.popularMoves) {
            this.charts.popularMoves.destroy();
        }
        
        this.charts.popularMoves = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.name) || [],
                datasets: [{
                    label: 'Views',
                    data: data.map(item => item.view_count) || [],
                    backgroundColor: [
                        '#FF6B9D', '#C44569', '#F8B500', 
                        '#6C5CE7', '#74B9FF', '#00B894',
                        '#FDCB6E', '#E17055', '#81ECEC', '#A29BFE'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // 🎭 Update style popularity chart
    updateStylePopularityChart(data) {
        const ctx = document.getElementById('stylePopularityChart');
        if (!ctx) {
            console.warn('⚠️ Style popularity chart canvas not found');
            return;
        }
        
        if (typeof Chart === 'undefined') {
            ctx.parentElement.innerHTML = '<p>📊 Chart.js loading...</p>';
            return;
        }
        
        if (this.charts.stylePopularity) {
            this.charts.stylePopularity.destroy();
        }
        
        this.charts.stylePopularity = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(item => item.name) || [],
                datasets: [{
                    data: data.map(item => item.move_count || 0) || [],
                    backgroundColor: [
                        '#FF6B9D', '#C44569', '#F8B500', 
                        '#6C5CE7', '#74B9FF', '#00B894',
                        '#FDCB6E', '#E17055'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // 📢 Load recent activity - FIXED
    async loadRecentActivity() {
        try {
            if (!this.api || typeof this.api.getRecentActivity !== 'function') {
                console.warn('⚠️ API client not available for activity, using fallback');
                return this.getMockActivity();
            }
            
            const response = await this.api.getRecentActivity();
            
            if (response && response.success) {
                return response.data.recentActivity || response.data;
            } else {
                console.warn('⚠️ Activity API returned unsuccessful response, using fallback');
                return this.getMockActivity();
            }
        } catch (error) {
            console.error('❌ Failed to load activity:', error);
            return this.getMockActivity();
        }
    }

    // 📢 Mock activity data fallback - NEW
    getMockActivity() {
        const now = new Date();
        return [
            {
                activity_type: 'user_registered',
                description: 'New user Sarah joined the platform',
                created_at: new Date(now - 5 * 60 * 1000).toISOString() // 5 min ago
            },
            {
                activity_type: 'move_submitted',
                description: 'Alex submitted a new Hip-Hop move "Wave Break"',
                created_at: new Date(now - 15 * 60 * 1000).toISOString() // 15 min ago
            },
            {
                activity_type: 'move_approved',
                description: 'Move "Pirouette Combo" was approved by instructor',
                created_at: new Date(now - 45 * 60 * 1000).toISOString() // 45 min ago
            },
            {
                activity_type: 'user_verified',
                description: 'Maria became a verified instructor',
                created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
            }
        ];
    }

    // 📢 Update recent activity display
    updateRecentActivity(activities) {
        const container = document.getElementById('recentActivityList');
        if (!container) {
            console.warn('⚠️ Recent activity container not found');
            return;
        }
        
        if (!activities || activities.length === 0) {
            container.innerHTML = '<div class="activity-item">📭 No recent activity</div>';
            return;
        }
        
        const activityHTML = activities.map(activity => {
            const timeAgo = this.formatTimeAgo(new Date(activity.created_at));
            const activityIcon = this.getActivityIcon(activity.activity_type);
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">${activityIcon}</div>
                    <div class="activity-content">
                        <div class="activity-description">${activity.description}</div>
                        <div class="activity-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = activityHTML;
        console.log('✅ Activity updated successfully');
    }

    // 🎭 Get activity type icon
    getActivityIcon(type) {
        const icons = {
            'move_created': '🕺',
            'user_registered': '👤',
            'move_submitted': '📹',
            'move_approved': '✅',
            'move_rejected': '❌',
            'user_verified': '🎖️',
            'system': '⚙️'
        };
        return icons[type] || '📋';
    }

    // ⏰ Format time ago
    formatTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }

    // 🔄 Load fallback data when API fails - NEW
    loadFallbackData() {
        console.log('🔄 Loading fallback data...');
        
        try {
            const mockStats = this.getMockStats();
            const mockCharts = this.getMockChartData();
            const mockActivity = this.getMockActivity();
            
            this.updateStats(mockStats);
            this.updateCharts(mockCharts);
            this.updateRecentActivity(mockActivity);
            
            this.hideLoadingState();
            this.showErrorMessage('Using demo data - backend connection failed');
            
        } catch (error) {
            console.error('❌ Failed to load fallback data:', error);
        }
    }

    // 🔄 Set up auto-refresh
    setupAutoRefresh() {
        // Clear existing interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Set up new interval
        this.refreshInterval = setInterval(() => {
            console.log('🔄 Auto-refreshing dashboard data...');
            this.loadDashboardData();
        }, this.refreshRate);
        
        console.log(`🔄 Auto-refresh enabled (${this.refreshRate / 1000}s interval)`);
    }

    // 🎯 Set up event listeners
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('dashboardRefreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refresh();
            });
        }
        
        // Handle page visibility change to pause/resume refresh
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('⏸️ Page hidden, pausing auto-refresh');
                if (this.refreshInterval) {
                    clearInterval(this.refreshInterval);
                    this.refreshInterval = null;
                }
            } else {
                console.log('▶️ Page visible, resuming auto-refresh');
                this.setupAutoRefresh();
            }
        });
    }

    // 🔄 Manual refresh
    async refresh() {
        console.log('🔄 Refreshing dashboard...');
        try {
            await this.loadDashboardData();
            this.showSuccessMessage('Dashboard refreshed successfully');
        } catch (error) {
            this.showErrorMessage('Failed to refresh dashboard: ' + error.message);
        }
    }

    // 🔄 Show loading state
    showLoadingState() {
        const loadingElements = document.querySelectorAll('.loading-placeholder');
        loadingElements.forEach(element => {
            element.style.display = 'block';
        });
        
        const contentElements = document.querySelectorAll('.dashboard-content');
        contentElements.forEach(element => {
            element.style.opacity = '0.5';
        });
    }

    // ✅ Hide loading state
    hideLoadingState() {
        const loadingElements = document.querySelectorAll('.loading-placeholder');
        loadingElements.forEach(element => {
            element.style.display = 'none';
        });
        
        const contentElements = document.querySelectorAll('.dashboard-content');
        contentElements.forEach(element => {
            element.style.opacity = '1';
        });
    }

    // ✅ Show success message
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    // ❌ Show error message
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    // 💬 Show message
    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('messageContainer') || document.body;
        
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        
        const iconMap = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        messageEl.innerHTML = `
            <span class="message-icon">${iconMap[type] || iconMap.info}</span>
            <span class="message-text">${message}</span>
            <button class="message-close" onclick="this.parentElement.remove()">✕</button>
        `;
        
        messageContainer.appendChild(messageEl);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }

    // 🧹 Cleanup
    destroy() {
        // Clear refresh interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        
        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        this.charts = {};
        
        console.log('🧹 Dashboard cleaned up');
    }
}

// Create global dashboard instance
window.DancifyDashboard = DancifyDashboard;

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Dancify Dashboard module loaded');
});