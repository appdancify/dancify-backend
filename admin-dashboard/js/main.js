// 💃 Dancify Admin Dashboard - Main Application Controller
// Central coordination of all dashboard components and real API integration

class DancifyAdmin {
    constructor() {
        this.components = {
            api: null,
            navigation: null,
            dashboard: null,
            sectionLoader: null
        };
        
        this.currentSection = 'dashboard';
        this.isInitialized = false;
        this.connectionStatus = 'disconnected';
        
        console.log('💃 Dancify Admin initializing...');
    }

    // 🚀 Initialize the application
    async init() {
        try {
            console.log('🔧 Starting Dancify Admin initialization...');
            
            // Initialize core components
            await this.initializeModules();
            
            // Set up global event listeners
            this.setupGlobalEventListeners();
            
            // Load initial section
            await this.loadSection('dashboard');
            
            // Start connection monitoring
            this.startConnectionMonitoring();
            
            this.isInitialized = true;
            console.log('✅ Dancify Admin initialized successfully');
            
        } catch (error) {
            console.error('❌ Dancify Admin initialization failed:', error);
            this.showCriticalError('Application failed to initialize: ' + error.message);
        }
    }

    // 🔧 Initialize core modules
    async initializeModules() {
        try {
            console.log('🔧 Loading core components...');
            
            // Initialize API client first (required by other components)
            if (window.DancifyAPI) {
                this.components.api = new window.DancifyAPI();
                await this.components.api.init();
                this.connectionStatus = 'connected';
            } else {
                throw new Error('DancifyAPI class not available');
            }
            
            // Initialize navigation system
            if (window.DancifyNavigation) {
                this.components.navigation = new window.DancifyNavigation();
                await this.components.navigation.init();
            } else {
                console.warn('⚠️ DancifyNavigation not available');
            }
            
            // Initialize section loader
            if (window.DancifySectionLoader) {
                this.components.sectionLoader = new window.DancifySectionLoader();
                await this.components.sectionLoader.init();
            } else {
                console.warn('⚠️ DancifySectionLoader not available');
            }
            
            // Initialize dashboard (will be loaded when section is activated)
            if (window.DancifyDashboard) {
                this.components.dashboard = new window.DancifyDashboard();
            }
            
            console.log('✅ Core components loaded');
            
        } catch (error) {
            console.error('❌ Failed to initialize modules:', error);
            throw error;
        }
    }

    // 🎯 Set up global event listeners
    setupGlobalEventListeners() {
        // Handle section navigation
        document.addEventListener('click', (event) => {
            this.handleGlobalClick(event);
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
        
        // Handle API authentication events
        window.addEventListener('auth:unauthorized', () => {
            this.handleUnauthorized();
        });
        
        // Handle connection status changes
        window.addEventListener('online', () => {
            this.handleConnectionChange(true);
        });
        
        window.addEventListener('offline', () => {
            this.handleConnectionChange(false);
        });
        
        // Handle before page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        console.log('✅ Global event listeners setup completed');
    }

    // 🖱️ Handle global click events
    handleGlobalClick(event) {
        const target = event.target.closest('[data-section]');
        
        if (target) {
            event.preventDefault();
            const section = target.getAttribute('data-section');
            this.loadSection(section);
            return;
        }
        
        // Handle other clickable elements
        const actionTarget = event.target.closest('[data-action]');
        if (actionTarget) {
            event.preventDefault();
            const action = actionTarget.getAttribute('data-action');
            this.handleAction(action, actionTarget);
        }
    }

    // ⌨️ Handle keyboard shortcuts
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + R: Refresh current section
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            this.refreshCurrentSection();
            return;
        }
        
        // Escape: Close modals
        if (event.key === 'Escape') {
            this.closeAllModals();
            return;
        }
        
        // Ctrl/Cmd + /: Show help
        if ((event.ctrlKey || event.metaKey) && event.key === '/') {
            event.preventDefault();
            this.showHelp();
            return;
        }
    }

    // 📄 Load a section
    async loadSection(sectionName) {
        if (!sectionName || this.currentSection === sectionName) {
            return;
        }
        
        try {
            console.log(`📂 Loading section: ${sectionName}`);
            
            // Update navigation state
            if (this.components.navigation) {
                this.components.navigation.setActiveSection(sectionName);
            }
            
            // Load section content
            if (this.components.sectionLoader) {
                await this.components.sectionLoader.loadSection(sectionName);
            }
            
            // Initialize section-specific functionality
            await this.initializeSectionFunctionality(sectionName);
            
            this.currentSection = sectionName;
            
            // Update URL hash
            if (window.history && window.history.pushState) {
                window.history.pushState(null, null, `#${sectionName}`);
            }
            
            console.log(`✅ Section loaded: ${sectionName}`);
            
        } catch (error) {
            console.error(`❌ Failed to load section ${sectionName}:`, error);
            this.showErrorMessage(`Failed to load ${sectionName}: ${error.message}`);
        }
    }

    // 🔧 Initialize section-specific functionality
    async initializeSectionFunctionality(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                if (this.components.dashboard && !this.components.dashboard.isInitialized) {
                    await this.components.dashboard.init();
                }
                break;
                
            case 'users':
                // Initialize user management functionality
                if (window.UserManager) {
                    const userManager = new window.UserManager(this.components.api);
                    await userManager.init();
                }
                break;
                
            case 'move-management':
                // Initialize move management functionality
                if (window.MoveManager) {
                    const moveManager = new window.MoveManager(this.components.api);
                    await moveManager.init();
                }
                break;
                
            case 'dance-style-management':
                // Initialize dance style management functionality
                if (window.DanceStyleManager) {
                    const styleManager = new window.DanceStyleManager(this.components.api);
                    await styleManager.init();
                }
                break;
                
            case 'move-submissions':
                // Initialize submission management functionality
                if (window.SubmissionManager) {
                    const submissionManager = new window.SubmissionManager(this.components.api);
                    await submissionManager.init();
                }
                break;
                
            default:
                console.log(`ℹ️ No specific initialization for section: ${sectionName}`);
        }
    }

    // 🎯 Handle various actions
    handleAction(action, element) {
        switch (action) {
            case 'refresh':
                this.refreshCurrentSection();
                break;
                
            case 'logout':
                this.handleLogout();
                break;
                
            case 'toggle-sidebar':
                this.toggleSidebar();
                break;
                
            case 'show-settings':
                this.loadSection('settings');
                break;
                
            default:
                console.warn(`⚠️ Unknown action: ${action}`);
        }
    }

    // 🔄 Refresh current section
    async refreshCurrentSection() {
        console.log(`🔄 Refreshing section: ${this.currentSection}`);
        
        try {
            // Refresh based on current section
            switch (this.currentSection) {
                case 'dashboard':
                    if (this.components.dashboard && this.components.dashboard.refresh) {
                        await this.components.dashboard.refresh();
                    }
                    break;
                    
                default:
                    // Reload the section
                    await this.loadSection(this.currentSection);
            }
            
            this.showSuccessMessage('Section refreshed successfully');
            
        } catch (error) {
            console.error('❌ Failed to refresh section:', error);
            this.showErrorMessage('Failed to refresh section: ' + error.message);
        }
    }

    // 🚪 Handle logout
    handleLogout() {
        if (this.components.api) {
            this.components.api.clearAuthTokens();
        }
        
        // Clear any cached data
        localStorage.removeItem('dancify_cache');
        
        // Redirect to login or show login form
        window.location.href = '/login';
    }

    // 📱 Toggle sidebar
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (sidebar && mainContent) {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('sidebar-collapsed');
        }
    }

    // ❓ Show help
    showHelp() {
        const helpModal = document.createElement('div');
        helpModal.className = 'modal-overlay';
        helpModal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2>💃 Dancify Admin Help</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <h3>Keyboard Shortcuts</h3>
                    <ul>
                        <li><kbd>Ctrl/Cmd + R</kbd> - Refresh current section</li>
                        <li><kbd>Esc</kbd> - Close modals</li>
                        <li><kbd>Ctrl/Cmd + /</kbd> - Show this help</li>
                    </ul>
                    
                    <h3>Navigation</h3>
                    <p>Use the sidebar to navigate between different sections of the admin dashboard.</p>
                    
                    <h3>Need Help?</h3>
                    <p>Contact support at <a href="mailto:support@dancify.com">support@dancify.com</a></p>
                </div>
            </div>
        `;
        
        document.body.appendChild(helpModal);
    }

    // 🔐 Handle unauthorized access
    handleUnauthorized() {
        console.warn('🔐 Unauthorized access detected');
        
        this.showErrorMessage('Your session has expired. Please log in again.');
        
        // Clear auth tokens
        if (this.components.api) {
            this.components.api.clearAuthTokens();
        }
        
        // Redirect to login after a short delay
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    }

    // 🌐 Handle connection changes
    handleConnectionChange(isOnline) {
        this.connectionStatus = isOnline ? 'connected' : 'disconnected';
        
        const statusIndicator = document.getElementById('connectionStatus');
        if (statusIndicator) {
            statusIndicator.className = `connection-status ${this.connectionStatus}`;
            statusIndicator.textContent = isOnline ? '🟢 Connected' : '🔴 Offline';
        }
        
        if (isOnline) {
            this.showSuccessMessage('Connection restored');
            // Refresh current section to get latest data
            this.refreshCurrentSection();
        } else {
            this.showErrorMessage('Connection lost - working offline');
        }
    }

    // 📡 Start connection monitoring
    startConnectionMonitoring() {
        // Check connection every 30 seconds
        setInterval(async () => {
            if (this.components.api) {
                try {
                    await this.components.api.ping();
                    if (this.connectionStatus !== 'connected') {
                        this.handleConnectionChange(true);
                    }
                } catch (error) {
                    if (this.connectionStatus !== 'disconnected') {
                        this.handleConnectionChange(false);
                    }
                }
            }
        }, 30000);
    }

    // ❌ Close all modals
    closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
    }

    // ✅ Show success message
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    // ❌ Show error message
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    // 🚨 Show critical error
    showCriticalError(message) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'critical-error';
        errorContainer.innerHTML = `
            <div class="error-content">
                <h2>💥 Critical Error</h2>
                <p>${message}</p>
                <button onclick="window.location.reload()">🔄 Reload Page</button>
            </div>
        `;
        
        document.body.appendChild(errorContainer);
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

    // 🧹 Cleanup before page unload
    cleanup() {
        console.log('🧹 Cleaning up Dancify Admin...');
        
        // Cleanup dashboard
        if (this.components.dashboard && this.components.dashboard.destroy) {
            this.components.dashboard.destroy();
        }
        
        // Clear any intervals or timeouts
        // (handled by individual components)
        
        console.log('✅ Cleanup completed');
    }

    // 📊 Get application status
    getStatus() {
        return {
            initialized: this.isInitialized,
            currentSection: this.currentSection,
            connectionStatus: this.connectionStatus,
            components: Object.keys(this.components).reduce((status, key) => {
                status[key] = this.components[key] ? 'loaded' : 'not loaded';
                return status;
            }, {})
        };
    }
}

// Create global admin instance
window.DancifyAdmin = DancifyAdmin;

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('💃 Starting Dancify Admin...');
    
    try {
        window.dancifyAdmin = new DancifyAdmin();
        await window.dancifyAdmin.init();
        
        // Handle URL hash on load
        const hash = window.location.hash.substring(1);
        if (hash && hash !== 'dashboard') {
            await window.dancifyAdmin.loadSection(hash);
        }
        
        console.log('🎉 Dancify Admin started successfully');
        
    } catch (error) {
        console.error('💥 Failed to start Dancify Admin:', error);
    }
});