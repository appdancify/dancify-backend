// 💃 Dancify Admin Dashboard - Main JavaScript
// Application initialization and core functionality
// Manages app lifecycle, error handling, and global state

class DancifyAdmin {
    constructor() {
        this.isInitialized = false;
        this.modules = {};
        this.currentSection = 'dashboard';
        this.loadingStates = new Map();
        this.globalState = {
            user: null,
            permissions: [],
            settings: {},
            syncStatus: 'synced'
        };
    }

    // 🚀 Initialize the application
    async init() {
        try {
            console.log('💃 Dancify Admin initializing...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Show loading screen
            this.showLoadingScreen();

            // Initialize core modules in sequence
            await this.initializeModules();
            
            // Setup global event listeners
            this.setupEventListeners();
            
            // Load initial section
            await this.loadInitialSection();
            
            // Setup auto-refresh and background tasks
            this.setupBackgroundTasks();
            
            // Hide loading screen and show app
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            console.log('✅ Dancify Admin initialized successfully');
            
        } catch (error) {
            console.error('💥 Failed to initialize Dancify Admin:', error);
            this.showError('Failed to initialize application: ' + error.message);
        }
    }

    // 🔧 Initialize all modules
    async initializeModules() {
        console.log('🔧 Loading core components...');
        
        try {
            // Initialize API client first
            if (window.DancifyAPI) {
                this.modules.api = new window.DancifyAPI();
                await this.modules.api.init();
            }
            
            // Initialize navigation
            if (window.DancifyNavigation) {
                this.modules.navigation = new window.DancifyNavigation();
                this.modules.navigation.init();
            }
            
            // Initialize section loader
            if (window.DancifySectionLoader) {
                this.modules.sectionLoader = new window.DancifySectionLoader();
                this.modules.sectionLoader.init();
            }
            
            // Initialize dashboard
            if (window.DancifyDashboard) {
                this.modules.dashboard = new window.DancifyDashboard();
            }
            
            // Initialize move management
            if (window.DancifyMoves) {
                this.modules.moves = new window.DancifyMoves();
            }
            
            // Initialize dance styles management
            if (window.DancifyStyles) {
                this.modules.styles = new window.DancifyStyles();
            }
            
            // Initialize move submissions
            if (window.DancifySubmissions) {
                this.modules.submissions = new window.DancifySubmissions();
            }
            
            console.log('✅ Core components loaded');
            
        } catch (error) {
            console.error('❌ Failed to load components:', error);
            throw error;
        }
    }

    // 📱 Setup global event listeners
    setupEventListeners() {
        // Global error handling
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
        
        // Navigation events
        document.addEventListener('click', this.handleGlobalClick.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // Window events
        window.addEventListener('resize', this.handleWindowResize.bind(this));
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
        
        // Visibility change for background sync
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        console.log('✅ Global event listeners setup completed');
    }

    // 🎯 Load initial section
    async loadInitialSection() {
        try {
            // Check URL hash for deep linking
            const hash = window.location.hash.slice(1);
            const targetSection = hash || this.currentSection;
            
            if (this.modules.sectionLoader) {
                await this.modules.sectionLoader.loadSection(targetSection);
            }
            
            if (this.modules.navigation) {
                this.modules.navigation.setActiveSection(targetSection);
            }
            
            this.currentSection = targetSection;
            this.updatePageTitle(targetSection);
            
        } catch (error) {
            console.error('❌ Failed to load initial section:', error);
            // Fallback to dashboard
            await this.loadSection('dashboard');
        }
    }

    // 📄 Load a specific section
    async loadSection(sectionName) {
        try {
            this.setLoadingState(sectionName, true);
            
            if (this.modules.sectionLoader) {
                await this.modules.sectionLoader.loadSection(sectionName);
            }
            
            if (this.modules.navigation) {
                this.modules.navigation.setActiveSection(sectionName);
            }
            
            this.currentSection = sectionName;
            this.updatePageTitle(sectionName);
            
            // Update URL hash
            window.location.hash = sectionName;
            
            this.setLoadingState(sectionName, false);
            
        } catch (error) {
            console.error(`❌ Failed to load section ${sectionName}:`, error);
            this.setLoadingState(sectionName, false);
            this.showError(`Failed to load ${sectionName} section`);
        }
    }

    // 🔄 Setup background tasks
    setupBackgroundTasks() {
        // Auto-refresh dashboard data every 5 minutes
        setInterval(() => {
            if (this.currentSection === 'dashboard' && document.visibilityState === 'visible') {
                this.refreshCurrentSection();
            }
        }, 5 * 60 * 1000);
        
        // Sync status check every minute
        setInterval(() => {
            this.checkSyncStatus();
        }, 60 * 1000);
        
        // Cleanup inactive connections every 30 minutes
        setInterval(() => {
            this.cleanupConnections();
        }, 30 * 60 * 1000);
    }

    // 📊 Refresh current section
    async refreshCurrentSection() {
        try {
            if (this.currentSection === 'dashboard' && this.modules.dashboard) {
                await this.modules.dashboard.refresh();
            } else if (this.currentSection === 'move-management' && this.modules.moves) {
                await this.modules.moves.refresh();
            } else if (this.currentSection === 'dance-style-management' && this.modules.styles) {
                await this.modules.styles.refresh();
            } else if (this.currentSection === 'move-submissions' && this.modules.submissions) {
                await this.modules.submissions.refresh();
            }
        } catch (error) {
            console.error('❌ Failed to refresh section:', error);
        }
    }

    // 🔗 Handle global clicks (for navigation and modals)
    handleGlobalClick(event) {
        const target = event.target.closest('[data-section]');
        if (target) {
            event.preventDefault();
            const sectionName = target.dataset.section;
            this.loadSection(sectionName);
            return;
        }
        
        // Handle modal closes
        if (event.target.classList.contains('modal-overlay')) {
            this.closeAllModals();
        }
        
        // Handle dropdown toggles
        const dropdown = event.target.closest('.user-avatar');
        if (dropdown) {
            this.toggleUserDropdown();
        } else {
            this.closeUserDropdown();
        }
    }

    // ⌨️ Handle keyboard shortcuts
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + K for global search
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            this.openGlobalSearch();
        }
        
        // Escape to close modals
        if (event.key === 'Escape') {
            this.closeAllModals();
            this.closeUserDropdown();
        }
        
        // Alt + numbers for quick navigation
        if (event.altKey && /^[1-9]$/.test(event.key)) {
            event.preventDefault();
            const sections = ['dashboard', 'users', 'move-management', 'dance-style-management', 'move-submissions'];
            const index = parseInt(event.key) - 1;
            if (sections[index]) {
                this.loadSection(sections[index]);
            }
        }
    }

    // 📱 Handle window resize
    handleWindowResize() {
        // Adjust layout for mobile
        if (window.innerWidth <= 768) {
            this.enableMobileMode();
        } else {
            this.disableMobileMode();
        }
    }

    // 🌐 Handle online/offline status
    handleOnline() {
        this.updateSyncStatus('synced');
        this.showNotification('Connection restored', 'success');
        this.refreshCurrentSection();
    }

    handleOffline() {
        this.updateSyncStatus('offline');
        this.showNotification('Connection lost - working offline', 'warning');
    }

    // 👁️ Handle visibility change
    handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            // Refresh data when tab becomes visible
            setTimeout(() => {
                this.refreshCurrentSection();
            }, 1000);
        }
    }

    // 🎯 Loading state management
    setLoadingState(identifier, isLoading) {
        if (isLoading) {
            this.loadingStates.set(identifier, true);
        } else {
            this.loadingStates.delete(identifier);
        }
        
        // Update global loading indicator
        const hasLoading = this.loadingStates.size > 0;
        this.updateSyncStatus(hasLoading ? 'syncing' : 'synced');
    }

    // 🔄 Sync status management
    updateSyncStatus(status) {
        this.globalState.syncStatus = status;
        const syncElement = document.getElementById('syncStatus');
        if (syncElement) {
            const iconElement = syncElement.querySelector('.sync-icon');
            const textElement = syncElement.querySelector('.sync-text');
            
            switch (status) {
                case 'syncing':
                    iconElement.textContent = '🔄';
                    textElement.textContent = 'Syncing...';
                    iconElement.style.animation = 'spin 1s linear infinite';
                    break;
                case 'offline':
                    iconElement.textContent = '⚠️';
                    textElement.textContent = 'Offline';
                    iconElement.style.animation = 'none';
                    break;
                default:
                    iconElement.textContent = '✅';
                    textElement.textContent = 'Synced';
                    iconElement.style.animation = 'none';
            }
        }
    }

    checkSyncStatus() {
        if (this.modules.api) {
            this.modules.api.ping().then(() => {
                if (this.globalState.syncStatus === 'offline') {
                    this.handleOnline();
                }
            }).catch(() => {
                if (this.globalState.syncStatus !== 'offline') {
                    this.handleOffline();
                }
            });
        }
    }

    // 📱 Mobile mode management
    enableMobileMode() {
        document.body.classList.add('mobile-mode');
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    }

    disableMobileMode() {
        document.body.classList.remove('mobile-mode');
    }

    // 🎨 UI Helper methods
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const mainContainer = document.getElementById('mainContainer');
        
        setTimeout(() => {
            if (loadingScreen) loadingScreen.style.display = 'none';
            if (mainContainer) mainContainer.style.display = 'flex';
        }, 1000);
    }

    updatePageTitle(sectionName) {
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            const titles = {
                'dashboard': 'Dashboard',
                'users': 'User Management',
                'move-management': 'Move Management',
                'dance-style-management': 'Dance Styles',
                'move-submissions': 'Move Submissions',
                'choreography': 'Choreography',
                'instructor-applications': 'Instructor Applications',
                'feedback': 'Feedback',
                'social-posts': 'Social Posts',
                'reports': 'Reports',
                'analytics': 'Analytics',
                'settings': 'Settings'
            };
            pageTitle.textContent = titles[sectionName] || sectionName;
        }
        
        // Update document title
        document.title = `💃 Dancify Admin - ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`;
    }

    toggleUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    closeUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
    }

    openGlobalSearch() {
        // TODO: Implement global search modal
        this.showNotification('Global search coming soon!', 'info');
    }

    // 🔧 Utility methods
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `toast toast-${type} show`;
        notification.innerHTML = `
            <span class="toast-icon">${this.getNotificationIcon(type)}</span>
            <span class="toast-message">${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    showError(message) {
        console.error('Application Error:', message);
        this.showNotification(message, 'error', 5000);
    }

    // 🧹 Cleanup methods
    cleanupConnections() {
        // Close idle connections, clear caches, etc.
        if (this.modules.api) {
            this.modules.api.cleanup();
        }
    }

    // 💥 Error handlers
    handleGlobalError(event) {
        console.error('Global error caught:', event.error);
        this.showError('An unexpected error occurred. Please refresh the page.');
    }

    handleUnhandledRejection(event) {
        console.error('Unhandled promise rejection:', event.reason);
        this.showError('A network error occurred. Please check your connection.');
    }

    // 🧹 Cleanup on app close
    cleanup() {
        // Remove event listeners
        window.removeEventListener('error', this.handleGlobalError);
        window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
        
        // Cleanup modules
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.cleanup === 'function') {
                module.cleanup();
            }
        });
        
        console.log('🧹 Application cleanup completed');
    }
}

// 🚀 Global app instance and initialization
window.dancifyAdmin = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('💃 Starting Dancify Admin...');
        
        // Create global app instance
        window.dancifyAdmin = new DancifyAdmin();
        
        // Initialize the application
        await window.dancifyAdmin.init();
        
        console.log('🎉 Dancify Admin started successfully');
        
    } catch (error) {
        console.error('💥 Failed to start Dancify Admin:', error);
        
        // Show fallback error message
        document.body.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background: linear-gradient(135deg, #8A2BE2, #FF69B4);
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div>
                    <h1>⚠️ Application Error</h1>
                    <p>Failed to start Dancify Admin Dashboard.</p>
                    <p style="font-size: 0.9em; opacity: 0.8;">Please refresh the page or contact support if the problem persists.</p>
                    <button onclick="window.location.reload()" style="
                        margin-top: 20px;
                        padding: 12px 24px;
                        background: white;
                        color: #8A2BE2;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Refresh Page</button>
                </div>
            </div>
        `;
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.dancifyAdmin) {
        window.dancifyAdmin.cleanup();
    }
});

console.log('📱 Dancify Admin main script loaded');