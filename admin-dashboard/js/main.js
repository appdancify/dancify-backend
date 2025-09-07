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
            
            // Load default dashboard section
            await this.loadDefaultSection();
            
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
                
                // Make API client globally available for other components
                window.apiClient = this.components.api;
                console.log('✅ API client initialized successfully');
            } else {
                throw new Error('DancifyAPI class not available');
            }
            
            // Initialize navigation system
            if (window.DancifyNavigation) {
                this.components.navigation = new window.DancifyNavigation();
                this.components.navigation.init();
                
                // Make navigation globally available
                window.navigationManager = this.components.navigation;
                console.log('✅ Navigation system initialized successfully');
            } else {
                throw new Error('DancifyNavigation class not available');
            }
            
            // Initialize section loader
            if (window.DancifySectionLoader) {
                this.components.sectionLoader = new window.DancifySectionLoader();
                this.components.sectionLoader.init();
                
                // Make section loader globally available
                window.sectionLoader = this.components.sectionLoader;
                console.log('✅ Section loader initialized successfully');
            } else {
                throw new Error('DancifySectionLoader class not available');
            }
            
            // Initialize dashboard
            if (window.DancifyDashboard) {
                this.components.dashboard = new window.DancifyDashboard();
                // Dashboard will be initialized when section loads
                console.log('✅ Dashboard component ready');
            } else {
                console.warn('⚠️ DancifyDashboard class not available');
            }
            
            console.log('✅ Core components loaded');
            
        } catch (error) {
            console.error('❌ Module initialization failed:', error);
            throw error;
        }
    }

    // 📄 Load default section (dashboard)
    async loadDefaultSection() {
        try {
            console.log('📊 Loading default dashboard section...');
            
            // Load dashboard section via section loader
            if (this.components.sectionLoader) {
                await this.components.sectionLoader.loadSection('dashboard');
                console.log('✅ Default section loaded successfully');
            } else {
                // Fallback: direct dashboard load
                await this.loadSection('dashboard');
            }
            
        } catch (error) {
            console.error('❌ Failed to load default section:', error);
            this.showErrorMessage('Failed to load dashboard: ' + error.message);
        }
    }

    // 🔗 Set up global event listeners
    setupGlobalEventListeners() {
        console.log('🔧 Setting up global event listeners...');
        
        // Handle navigation clicks with proper delegation
        document.addEventListener('click', async (e) => {
            // Handle section navigation
            const sectionLink = e.target.closest('[data-section]');
            if (sectionLink) {
                e.preventDefault();
                const sectionName = sectionLink.dataset.section;
                console.log(`🔗 Navigation clicked: ${sectionName}`);
                
                // Update navigation active state immediately for responsiveness
                this.updateNavigationState(sectionName);
                
                // Load the section
                await this.loadSection(sectionName);
                return;
            }
            
            // Handle action buttons
            const actionButton = e.target.closest('[data-action]');
            if (actionButton) {
                e.preventDefault();
                const action = actionButton.dataset.action;
                await this.handleAction(action, actionButton);
                return;
            }
        });
        
        // Handle hash changes for direct URL navigation
        window.addEventListener('hashchange', async () => {
            const hash = window.location.hash.slice(1);
            if (hash && this.components.sectionLoader?.sectionConfig[hash]) {
                console.log(`🔗 Hash change navigation: ${hash}`);
                await this.loadSection(hash);
            }
        });
        
        // Handle initial hash on page load
        const initialHash = window.location.hash.slice(1);
        if (initialHash && initialHash !== 'dashboard') {
            // Load after initialization is complete
            setTimeout(() => {
                console.log(`🔗 Initial hash navigation: ${initialHash}`);
                this.loadSection(initialHash);
            }, 1000);
        }
        
        // Handle browser back/forward
        window.addEventListener('popstate', async () => {
            const hash = window.location.hash.slice(1) || 'dashboard';
            console.log(`🔗 Browser navigation: ${hash}`);
            await this.loadSection(hash);
        });
        
        console.log('✅ Global event listeners setup completed');
    }

    // 📄 Load section with comprehensive error handling
    async loadSection(sectionName) {
        try {
            console.log(`📂 Loading section: ${sectionName}`);
            
            if (!this.components.sectionLoader) {
                throw new Error('Section loader not available');
            }
            
            // Validate section exists
            if (!this.components.sectionLoader.sectionConfig[sectionName]) {
                throw new Error(`Unknown section: ${sectionName}`);
            }
            
            // Show loading state
            this.showSectionLoading(sectionName);
            
            // Load the section
            const success = await this.components.sectionLoader.loadSection(sectionName);
            
            if (success) {
                this.currentSection = sectionName;
                console.log(`✅ Section loaded successfully: ${sectionName}`);
                
                // Initialize section-specific functionality
                await this.initializeSectionFunctionality(sectionName);
            } else {
                throw new Error(`Failed to load section: ${sectionName}`);
            }
            
        } catch (error) {
            console.error(`❌ Failed to load section ${sectionName}:`, error);
            this.showErrorMessage(`Failed to load ${sectionName}: ${error.message}`);
            
            // Fallback to dashboard if current section fails
            if (sectionName !== 'dashboard') {
                console.log('🔄 Falling back to dashboard...');
                setTimeout(() => this.loadSection('dashboard'), 2000);
            }
        }
    }

    // 🔧 Initialize section-specific functionality
    async initializeSectionFunctionality(sectionName) {
        try {
            console.log(`🔧 Initializing functionality for: ${sectionName}`);
            
            switch (sectionName) {
                case 'dashboard':
                    if (this.components.dashboard && !this.components.dashboard.isInitialized) {
                        await this.components.dashboard.init();
                        console.log('✅ Dashboard functionality initialized');
                    }
                    break;
                    
                case 'move-management':
                    // Enhanced move management initialization
                    if (window.MoveManager && this.components.api) {
                        if (!window.moveManager) {
                            console.log('🕺 Creating MoveManager instance...');
                            window.moveManager = new window.MoveManager(this.components.api);
                        }
                        
                        // Always call init to refresh data and setup
                        console.log('🕺 Initializing move management...');
                        await window.moveManager.init();
                        console.log('✅ Move management initialized successfully');
                    } else {
                        console.error('❌ MoveManager or API not available');
                        console.log('Available classes:', Object.keys(window).filter(k => k.includes('Manager')));
                        throw new Error('Move management components not available');
                    }
                    break;
                    
                case 'users':
                    if (window.UserManager && this.components.api) {
                        if (!window.userManager) {
                            console.log('👥 Creating UserManager instance...');
                            window.userManager = new window.UserManager(this.components.api);
                        }
                        await window.userManager.init();
                        console.log('✅ User management initialized successfully');
                    }
                    break;
                    
                case 'dance-style-management':
                    if (window.DanceStyleManager && this.components.api) {
                        if (!window.styleManager) {
                            console.log('🎭 Creating DanceStyleManager instance...');
                            window.styleManager = new window.DanceStyleManager(this.components.api);
                        }
                        await window.styleManager.init();
                        console.log('✅ Dance style management initialized successfully');
                    }
                    break;
                    
                case 'move-submissions':
                    if (window.SubmissionManager && this.components.api) {
                        if (!window.submissionManager) {
                            console.log('📹 Creating SubmissionManager instance...');
                            window.submissionManager = new window.SubmissionManager(this.components.api);
                        }
                        await window.submissionManager.init();
                        console.log('✅ Move submissions management initialized successfully');
                    }
                    break;
                    
                default:
                    console.log(`ℹ️ No specific initialization required for: ${sectionName}`);
                    break;
            }
            
        } catch (error) {
            console.error(`❌ Failed to initialize ${sectionName} functionality:`, error);
            throw error;
        }
    }

    // 🧭 Update navigation active state
    updateNavigationState(sectionName) {
        const navItems = document.querySelectorAll('[data-section]');
        navItems.forEach(item => {
            if (item.dataset.section === sectionName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // 🔄 Show section loading state
    showSectionLoading(sectionName) {
        const contentContainer = document.querySelector('.content-container');
        if (contentContainer) {
            const sectionTitle = sectionName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            contentContainer.innerHTML = `
                <div class="section-loading">
                    <div class="loading-spinner"></div>
                    <h2>Loading ${sectionTitle}</h2>
                    <p>Please wait while we load the interface...</p>
                </div>
            `;
        }
    }

    // 🎬 Handle action buttons
    async handleAction(action, button) {
        console.log(`🎬 Handling action: ${action}`);
        
        try {
            switch (action) {
                case 'refresh':
                    await this.refreshCurrentSection();
                    this.showSuccessMessage('Section refreshed successfully');
                    break;
                    
                case 'create-move':
                    if (window.moveManager && typeof window.moveManager.showCreateMoveModal === 'function') {
                        window.moveManager.showCreateMoveModal();
                    } else {
                        // Navigate to move management if not available
                        await this.loadSection('move-management');
                    }
                    break;
                    
                case 'create-user':
                    if (window.userManager && typeof window.userManager.showCreateUserModal === 'function') {
                        window.userManager.showCreateUserModal();
                    } else {
                        await this.loadSection('users');
                    }
                    break;
                    
                default:
                    console.warn(`⚠️ Unknown action: ${action}`);
                    this.showErrorMessage(`Unknown action: ${action}`);
                    break;
            }
        } catch (error) {
            console.error(`❌ Error handling action ${action}:`, error);
            this.showErrorMessage(`Failed to execute action: ${error.message}`);
        }
    }

    // 🔄 Refresh current section
    async refreshCurrentSection() {
        if (this.currentSection && this.components.sectionLoader) {
            console.log(`🔄 Refreshing current section: ${this.currentSection}`);
            
            // Clear the section from cache to force reload
            this.components.sectionLoader.loadedSections.delete(this.currentSection);
            this.components.sectionLoader.sectionCache.delete(this.currentSection);
            
            // Reload the section
            await this.loadSection(this.currentSection);
        }
    }

    // 📡 Start connection monitoring
    startConnectionMonitoring() {
        console.log('📡 Starting connection monitoring...');
        
        // Initial connection check
        this.checkConnection();
        
        // Periodic connection check
        setInterval(async () => {
            await this.checkConnection();
        }, 30000); // Check every 30 seconds
        
        // Update connection status display
        this.updateConnectionDisplay();
    }

    // 🔍 Check connection status
    async checkConnection() {
        try {
            if (this.components.api) {
                const health = await this.components.api.checkHealth();
                this.connectionStatus = health.success ? 'connected' : 'disconnected';
            } else {
                this.connectionStatus = 'disconnected';
            }
        } catch (error) {
            console.warn('⚠️ Connection check failed:', error);
            this.connectionStatus = 'disconnected';
        }
        
        this.updateConnectionDisplay();
    }

    // 📊 Update connection display
    updateConnectionDisplay() {
        const connectionIndicator = document.getElementById('connectionStatus');
        if (connectionIndicator) {
            connectionIndicator.className = `connection-status ${this.connectionStatus}`;
            connectionIndicator.textContent = this.connectionStatus === 'connected' ? '🟢 Online' : '🔴 Offline';
        }
    }

    // 💬 Message helpers
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showWarningMessage(message) {
        this.showMessage(message, 'warning');
    }

    showInfoMessage(message) {
        this.showMessage(message, 'info');
    }

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
        
        // Auto-remove after delay
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, type === 'error' ? 8000 : 5000); // Errors stay longer
    }

    // 🚨 Show critical error
    showCriticalError(message) {
        console.error('🚨 Critical Error:', message);
        
        document.body.innerHTML = `
            <div class="critical-error">
                <div class="error-content">
                    <h1>❌ Critical Error</h1>
                    <p>${message}</p>
                    <div class="error-actions">
                        <button class="btn btn-primary" onclick="window.location.reload()">
                            🔄 Reload Page
                        </button>
                        <button class="btn btn-secondary" onclick="console.log('Debug info:', window.dancifyAdmin)">
                            🔍 Debug Info
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // 📊 Get application status
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            currentSection: this.currentSection,
            connectionStatus: this.connectionStatus,
            components: {
                api: !!this.components.api,
                navigation: !!this.components.navigation,
                dashboard: !!this.components.dashboard,
                sectionLoader: !!this.components.sectionLoader
            },
            sections: this.components.sectionLoader ? this.components.sectionLoader.getStats() : null
        };
    }

    // 🧹 Cleanup
    cleanup() {
        console.log('🧹 Cleaning up Dancify Admin...');
        
        // Clear intervals
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
        }
        
        // Cleanup components
        if (this.components.sectionLoader) {
            this.components.sectionLoader.cleanup();
        }
        
        // Clear global references
        window.apiClient = null;
        window.navigationManager = null;
        window.sectionLoader = null;
        window.moveManager = null;
        window.userManager = null;
        window.styleManager = null;
        window.submissionManager = null;
        
        console.log('✅ Cleanup completed');
    }
}

// 🌐 Initialize the application
window.dancifyAdmin = new DancifyAdmin();

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM loaded, initializing Dancify Admin...');
        window.dancifyAdmin.init();
    });
} else {
    console.log('📄 DOM already loaded, initializing Dancify Admin...');
    window.dancifyAdmin.init();
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('🚨 Global error:', event.error);
    if (window.dancifyAdmin && window.dancifyAdmin.isInitialized) {
        window.dancifyAdmin.showErrorMessage('An unexpected error occurred. Please refresh the page if problems persist.');
    }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
    if (window.dancifyAdmin && window.dancifyAdmin.isInitialized) {
        window.dancifyAdmin.showErrorMessage('A background operation failed. Some features may not work correctly.');
    }
});

console.log('💃 Dancify Admin main script loaded');