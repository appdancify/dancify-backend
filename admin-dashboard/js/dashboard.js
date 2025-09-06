// 💃 Dancify Admin Dashboard - Dashboard Analytics
// Handles dashboard statistics, charts, and real-time data display
// Beautiful visualizations for dance move analytics and user engagement

class DancifyDashboard {
    constructor() {
        this.api = null;
        this.charts = {};
        this.refreshInterval = null;
        this.isLoading = false;
        this.lastUpdate = null;
        
        // Chart configuration
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(138, 43, 226, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(138, 43, 226, 0.1)'
                    }
                }
            }
        };
    }

    // 🚀 Initialize dashboard
    async init() {
        try {
            console.log('📊 Initializing Dancify Dashboard...');
            
            this.api = window.dancifyAdmin?.modules?.api;
            if (!this.api) {
                throw new Error('API client not available');
            }
            
            await this.loadDashboardData();
            this.setupAutoRefresh();
            this.setupEventListeners();
            
            console.log('✅ Dashboard initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize dashboard:', error);
            this.showErrorState();
        }
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
            this.showErrorMessage('Failed to load dashboard data');
        } finally {
            this.isLoading = false;
        }
    }

    // 📈 Load dashboard statistics
    async loadStats() {
        try {
            const response = await this.api.getDashboardStats();
            return response.success ? response.data : null;
        } catch (error) {
            console.error('❌ Failed to load stats:', error);
            return null;
        }
    }

    // 📊 Update statistics display
    updateStats(data) {
        const stats = {
            totalUsers: data.users?.total || 0,
            usersChange: data.users?.change || 0,
            totalMoves: data.moves?.total || 0,
            movesChange: data.moves?.pending || 0,
            totalSubmissions: data.submissions?.total || 0,
            submissionsChange: data.submissions?.pending || 0,
            totalDanceStyles: data.danceStyles?.total || 0,
            stylesChange: data.danceStyles?.active || 0,
            totalInstructors: data.instructors?.total || 0,
            instructorsChange: data.instructors?.pending || 0
        };

        // Update stat cards
        this.updateStatCard('totalUsers', stats.totalUsers, this.formatChange(stats.usersChange, 'today'));
        this.updateStatCard('totalMoves', stats.totalMoves, this.formatChange(stats.movesChange, 'pending'));
        this.updateStatCard('totalSubmissions', stats.totalSubmissions, this.formatChange(stats.submissionsChange, 'pending'));
        this.updateStatCard('totalDanceStyles', stats.totalDanceStyles, this.formatChange(stats.stylesChange, 'active'));
        this.updateStatCard('totalInstructors', stats.totalInstructors, this.formatChange(stats.instructorsChange, 'pending'));
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
            const response = await this.api.getDashboardCharts();
            return response.success ? response.data : null;
        } catch (error) {
            console.error('❌ Failed to load charts:', error);
            return null;
        }
    }

    // 📈 Update chart displays
    updateCharts(data) {
        if (data.engagement) {
            this.updateEngagementChart(data.engagement);
        }
        
        if (data.danceStyles) {
            this.updateDanceStylesChart(data.danceStyles);
        }
    }

    // 📈 Update user engagement chart
    updateEngagementChart(data) {
        const ctx = document.getElementById('engagementChart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.charts.engagement) {
            this.charts.engagement.destroy();
        }
        
        this.charts.engagement = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'Active Users',
                    data: data.activeUsers || [],
                    borderColor: '#8A2BE2',
                    backgroundColor: 'rgba(138, 43, 226, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Move Submissions',
                    data: data.submissions || [],
                    borderColor: '#FF69B4',
                    backgroundColor: 'rgba(255, 105, 180, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'User Engagement Over Time'
                    }
                }
            }
        });
    }

    // 🎭 Update dance styles popularity chart
    updateDanceStylesChart(data) {
        const ctx = document.getElementById('danceStylesChart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.charts.danceStyles) {
            this.charts.danceStyles.destroy();
        }
        
        // Generate beautiful gradient colors for each dance style
        const colors = this.generateChartColors(data.labels?.length || 0);
        
        this.charts.danceStyles = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels || [],
                datasets: [{
                    data: data.values || [],
                    backgroundColor: colors.backgrounds,
                    borderColor: colors.borders,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right'
                    },
                    title: {
                        display: true,
                        text: 'Popular Dance Styles'
                    }
                }
            }
        });
    }

    // 🎨 Generate beautiful colors for charts
    generateChartColors(count) {
        const baseColors = [
            '#8A2BE2', '#FF69B4', '#9370DB', '#FFB6C1', 
            '#BA55D3', '#FF1493', '#DA70D6', '#FF6347',
            '#DDA0DD', '#F0E68C'
        ];
        
        const backgrounds = [];
        const borders = [];
        
        for (let i = 0; i < count; i++) {
            const color = baseColors[i % baseColors.length];
            backgrounds.push(color + '80'); // Add transparency
            borders.push(color);
        }
        
        return { backgrounds, borders };
    }

    // 📰 Load and update recent activity
    async loadRecentActivity() {
        try {
            const response = await this.api.getRecentActivity();
            return response.success ? response.data : null;
        } catch (error) {
            console.error('❌ Failed to load activity:', error);
            return null;
        }
    }

    // 🔄 Update recent activity display
    updateRecentActivity(activities) {
        const container = document.getElementById('activityList');
        if (!container) return;
        
        if (!activities || activities.length === 0) {
            container.innerHTML = `
                <div class="activity-item">
                    <span class="activity-icon">📝</span>
                    <span class="activity-text">No recent activity</span>
                    <span class="activity-time">-</span>
                </div>
            `;
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <span class="activity-icon">${this.getActivityIcon(activity.type)}</span>
                <span class="activity-text">${activity.message}</span>
                <span class="activity-time">${this.formatTime(activity.timestamp)}</span>
            </div>
        `).join('');
    }

    // 🎯 Get appropriate icon for activity type
    getActivityIcon(type) {
        const icons = {
            'user_registered': '👤',
            'move_created': '🕺',
            'move_submitted': '📹',
            'style_created': '🎭',
            'instructor_applied': '🎓',
            'feedback_received': '💬',
            'post_created': '📱',
            'move_approved': '✅',
            'move_rejected': '❌',
            'default': '📝'
        };
        return icons[type] || icons.default;
    }

    // ⏰ Format time for activity display
    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return time.toLocaleDateString();
    }

    // 📊 Format change indicators
    formatChange(value, suffix = '') {
        if (value === 0) return `0 ${suffix}`;
        const sign = value > 0 ? '+' : '';
        return `${sign}${value} ${suffix}`;
    }

    // 🔄 Setup auto-refresh
    setupAutoRefresh() {
        // Refresh every 5 minutes
        this.refreshInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.refresh();
            }
        }, 5 * 60 * 1000);
    }

    // 🎯 Setup event listeners
    setupEventListeners() {
        // Handle manual refresh
        const refreshButton = document.querySelector('[data-action="refresh-dashboard"]');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => this.refresh());
        }
        
        // Handle chart interactions
        document.addEventListener('click', (event) => {
            if (event.target.closest('.chart-container')) {
                // Handle chart clicks (future: drill-down functionality)
            }
        });
    }

    // 🔄 Manual refresh
    async refresh() {
        console.log('🔄 Refreshing dashboard...');
        await this.loadDashboardData();
        this.showNotification('Dashboard refreshed', 'success');
    }

    // 🎨 UI State Management
    showLoadingState() {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            card.classList.add('loading');
        });
        
        const charts = document.querySelectorAll('.chart-container');
        charts.forEach(chart => {
            chart.classList.add('loading');
        });
    }

    hideLoadingState() {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(element => {
            element.classList.remove('loading');
        });
    }

    showErrorState() {
        const container = document.getElementById('dashboard');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Failed to load dashboard</h3>
                    <p>Unable to connect to the server. Please check your connection and try again.</p>
                    <button class="btn btn-primary" onclick="window.dancifyAdmin.modules.dashboard.init()">
                        🔄 Retry
                    </button>
                </div>
            `;
        }
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        if (window.dancifyAdmin) {
            window.dancifyAdmin.showNotification(message, type);
        }
    }

    // 📊 Export dashboard data
    async exportDashboardData(format = 'csv') {
        try {
            const response = await this.api.exportData('dashboard', format);
            if (response.success) {
                // Create download link
                const blob = new Blob([response.data], { 
                    type: format === 'csv' ? 'text/csv' : 'application/json' 
                });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `dancify-dashboard-${new Date().toISOString().split('T')[0]}.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.showNotification('Dashboard data exported successfully', 'success');
            }
        } catch (error) {
            console.error('❌ Failed to export dashboard data:', error);
            this.showNotification('Failed to export dashboard data', 'error');
        }
    }

    // 📱 Responsive chart handling
    handleResize() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    // 🧹 Cleanup
    cleanup() {
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
        
        console.log('🧹 Dashboard cleanup completed');
    }
}

// 🎯 Dashboard utilities
const DashboardUtils = {
    // Format numbers with appropriate suffixes
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },
    
    // Calculate percentage change
    calculatePercentageChange(current, previous) {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    },
    
    // Generate mock data for development
    generateMockData() {
        return {
            stats: {
                users: { total: 1250, change: 45 },
                moves: { total: 180, pending: 12 },
                submissions: { total: 890, pending: 23 },
                danceStyles: { total: 8, active: 8 },
                instructors: { total: 34, pending: 5 }
            },
            engagement: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                activeUsers: [120, 135, 98, 156, 178, 203, 145],
                submissions: [23, 34, 18, 45, 56, 67, 34]
            },
            danceStyles: {
                labels: ['Ballet', 'Hip-Hop', 'Salsa', 'Contemporary', 'Jazz'],
                values: [250, 420, 180, 150, 100]
            },
            activity: [
                { type: 'move_created', message: 'New move "Pirouette Basic" created', timestamp: new Date(Date.now() - 5 * 60000) },
                { type: 'user_registered', message: 'New user registration', timestamp: new Date(Date.now() - 12 * 60000) },
                { type: 'move_submitted', message: 'Move submission pending review', timestamp: new Date(Date.now() - 23 * 60000) }
            ]
        };
    }
};

// 🌐 Export for global use
window.DancifyDashboard = DancifyDashboard;
window.DashboardUtils = DashboardUtils;

console.log('📊 Dancify Dashboard module loaded');