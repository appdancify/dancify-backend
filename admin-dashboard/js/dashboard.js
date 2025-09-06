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
        }
    }

    // ⏳ Wait for API client to be available
    async waitForAPI() {
        return new Promise((resolve, reject) => {
            const maxWait = 10000; // 10 seconds
            const checkInterval = 100; // 100ms
            let elapsed = 0;
            
            const checkAPI = () => {
                const api = window.DancifyAPI ? new window.DancifyAPI() : null;
                
                if (api) {
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
            const [statsData, chartsData, activityData] = await Promise.all([
                this.loadStats(),
                this.loadCharts(),
                this.loadRecentActivity()
            ]);
            
            if (statsData) this.updateStats(statsData);
            if (chartsData) this.updateCharts(chartsData);
            if (activityData) this.updateRecentActivity(activityData);
            
            this.hideLoadingState();
            this.lastUpdate = new Date();
            
        } catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
            this.showErrorMessage('Failed to load dashboard data: ' + error.message);
        } finally {
            this.isLoading = false;
        }
    }

    // 📈 Load dashboard statistics
    async loadStats() {
        try {
            if (!this.api || typeof this.api.getDashboardStats !== 'function') {
                throw new Error('API client not available for stats');
            }
            
            const response = await this.api.getDashboardStats();
            return response.success ? response.data : null;
        } catch (error) {
            console.error('❌ Failed to load stats:', error);
            throw error;
        }
    }

    // 📊 Update statistics display
    updateStats(data) {
        const stats = {
            totalUsers: data.stats?.totalUsers || 0,
            usersChange: data.stats?.newUsersThisMonth || 0,
            totalMoves: data.stats?.totalMoves || 0,
            movesChange: data.stats?.newMovesThisMonth || 0,
            totalSubmissions: data.stats?.totalSubmissions || 0,
            submissionsChange: data.stats?.pendingSubmissions || 0,
            totalDanceStyles: data.stats?.totalDanceStyles || 0,
            stylesChange: data.stats?.totalDanceStyles || 0
        };

        // Update stat cards with animation
        this.updateStatCard('totalUsers', stats.totalUsers, this.formatChange(stats.usersChange, 'new this month'));
        this.updateStatCard('totalMoves', stats.totalMoves, this.formatChange(stats.movesChange, 'new this month'));
        this.updateStatCard('totalSubmissions', stats.totalSubmissions, this.formatChange(stats.submissionsChange, 'pending'));
        this.updateStatCard('totalDanceStyles', stats.totalDanceStyles, this.formatChange(stats.stylesChange, 'active'));
    }

    // 🎯 Update individual stat card
    updateStatCard(elementId, value, change) {
        const valueElement = document.getElementById(elementId);
        const changeElement = document.getElementById(elementId.replace('total', '') + 'Change');
        
        if (valueElement) {
            // Animate number change
            this.animateValue(valueElement, parseInt(valueElement.textContent) || 0, value, 1000);
        }
        
        if (changeElement) {
            changeElement.textContent = change;
            changeElement.className = 'change ' + (change.includes('+') ? 'positive' : '');
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

    // 📊 Load and update charts
    async loadCharts() {
        try {
            if (!this.api || typeof this.api.getDashboardCharts !== 'function') {
                throw new Error('API client not available for charts');
            }
            
            const response = await this.api.getDashboardCharts();
            return response.success ? response.data : null;
        } catch (error) {
            console.error('❌ Failed to load charts:', error);
            throw error;
        }
    }

    // 📈 Update chart displays
    updateCharts(data) {
        if (data.userGrowth) {
            this.updateUserGrowthChart(data.userGrowth);
        }
        
        if (data.popularMoves) {
            this.updatePopularMovesChart(data.popularMoves);
        }
        
        if (data.stylePopularity) {
            this.updateStylePopularityChart(data.stylePopularity);
        }
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
        if (!ctx) return;
        
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
        if (!ctx) return;
        
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

    // 📢 Load recent activity
    async loadRecentActivity() {
        try {
            if (!this.api || typeof this.api.getRecentActivity !== 'function') {
                throw new Error('API client not available for activity');
            }
            
            const response = await this.api.getRecentActivity();
            return response.success ? response.data.recentActivity : null;
        } catch (error) {
            console.error('❌ Failed to load activity:', error);
            throw error;
        }
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
        messageEl.textContent = message;
        
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