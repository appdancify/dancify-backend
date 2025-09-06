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
            
            // FIXED: Load dashboard section content by default
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
            } else {
                throw new Error('DancifyAPI class not available');
            }
            
            // Initialize navigation system
            if (window.DancifyNavigation) {
                this.components.navigation = new window.DancifyNavigation();
                this.components.navigation.init();
                
                // Make navigation globally available
                window.navigationManager = this.components.navigation;
            } else {
                throw new Error('DancifyNavigation class not available');
            }
            
            // Initialize section loader
            if (window.DancifySectionLoader) {
                this.components.sectionLoader = new window.DancifySectionLoader();
                this.components.sectionLoader.init();
                
                // Make section loader globally available
                window.sectionLoader = this.components.sectionLoader;
            } else {
                throw new Error('DancifySectionLoader class not available');
            }
            
            // Initialize dashboard
            if (window.DancifyDashboard) {
                this.components.dashboard = new window.DancifyDashboard();
                // Dashboard will be initialized when section loads
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
        
        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            const sectionLink = e.target.closest('[data-section]');
            if (sectionLink) {
                e.preventDefault();
                const section = sectionLink.dataset.section;
                this.loadSection(section);
            }
            
            // Handle action buttons
            const actionButton = e.target.closest('[data-action]');
            if (actionButton) {
                e.preventDefault();
                const action = actionButton.dataset.action;
                this.handleAction(action, actionButton);
            }
        });
        
        // Handle hash changes for direct navigation
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1);
            if (hash && hash !== this.currentSection) {
                this.loadSection(hash);
            }
        });
        
        // Handle connection status changes
        window.addEventListener('online', () => {
            this.connectionStatus = 'connected';
            this.showSuccessMessage('Connection restored');
            this.refreshCurrentSection();
        });
        
        window.addEventListener('offline', () => {
            this.connectionStatus = 'disconnected';
            this.showWarningMessage('Connection lost - working offline');
        });
        
        console.log('✅ Global event listeners setup completed');
    }

    // 📄 Load a specific section
    async loadSection(sectionName) {
        try {
            console.log(`📂 Loading section: ${sectionName}`);
            
            // Use section loader if available
            if (this.components.sectionLoader) {
                await this.components.sectionLoader.loadSection(sectionName);
            } else {
                // Fallback: manual section loading
                await this.manualLoadSection(sectionName);
            }
            
            // Update navigation
            if (this.components.navigation) {
                this.components.navigation.setActiveSection(sectionName);
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

    // 📄 Manual section loading (fallback)
    async manualLoadSection(sectionName) {
        const mainContent = document.getElementById('mainContent');
        const contentContainer = mainContent?.querySelector('.content-container');
        
        if (!contentContainer) {
            throw new Error('Content container not found');
        }
        
        // Hide all sections
        const allSections = contentContainer.querySelectorAll('.content-section');
        allSections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        
        // Show target section
        let targetSection = document.getElementById(sectionName);
        if (!targetSection) {
            // Create section if it doesn't exist
            targetSection = document.createElement('section');
            targetSection.id = sectionName;
            targetSection.className = 'content-section';
            targetSection.innerHTML = `
                <div class="section-placeholder">
                    <h2>📊 ${sectionName.replace('-', ' ').toUpperCase()}</h2>
                    <p>Loading ${sectionName} interface...</p>
                </div>
            `;
            contentContainer.appendChild(targetSection);
        }
        
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
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
                if (window.MoveManager && this.components.api) {
                    if (!window.moveManager) {
                        window.moveManager = new window.MoveManager(this.components.api);
                    }
                    if (typeof window.moveManager.init === 'function') {
                        await window.moveManager.init();
                    }
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

    // 📱 Toggle sidebar
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
        }
    }

    // 🚪 Handle logout
    handleLogout() {
        if (this.components.api && this.components.api.logout) {
            this.components.api.logout();
        }
        
        // Clear local data
        this.clearLocalData();
        
        // Redirect to login
        window.location.href = '/login';
    }

    // 🧹 Clear local data
    clearLocalData() {
        // Clear any cached data
        if (this.components.sectionLoader) {
            this.components.sectionLoader.clearCache();
        }
        
        // Stop auto-refresh
        this.stopConnectionMonitoring();
    }

    // 📡 Start connection monitoring
    startConnectionMonitoring() {
        console.log('📡 Starting connection monitoring...');
        
        // Check connection every 30 seconds
        this.connectionInterval = setInterval(async () => {
            try {
                if (this.components.api && this.components.api.checkHealth) {
                    const isConnected = await this.components.api.checkHealth();
                    
                    if (isConnected && this.connectionStatus === 'disconnected') {
                        this.connectionStatus = 'connected';
                        this.showSuccessMessage('Connection restored');
                    } else if (!isConnected && this.connectionStatus === 'connected') {
                        this.connectionStatus = 'disconnected';
                        this.showWarningMessage('Connection lost');
                    }
                }
            } catch (error) {
                console.warn('Connection check failed:', error);
            }
        }, 30000);
    }

    // 📡 Stop connection monitoring
    stopConnectionMonitoring() {
        if (this.connectionInterval) {
            clearInterval(this.connectionInterval);
            this.connectionInterval = null;
        }
    }

    // 🔔 Show messages
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showWarningMessage(message) {
        this.showMessage(message, 'warning');
    }

    showCriticalError(message) {
        // Show critical error overlay
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'critical-error-overlay';
        errorOverlay.innerHTML = `
            <div class="error-content">
                <h2>❌ Critical Error</h2>
                <p>${message}</p>
                <button onclick="window.location.reload()">🔄 Reload Application</button>
            </div>
        `;
        document.body.appendChild(errorOverlay);
    }

    showMessage(message, type = 'info') {
        // Create or find message container
        let messageContainer = document.getElementById('messageContainer');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'messageContainer';
            messageContainer.className = 'message-container';
            document.body.appendChild(messageContainer);
        }
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.innerHTML = `
            <span class="message-text">${message}</span>
            <button class="message-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        messageContainer.appendChild(messageElement);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.remove();
            }
        }, 5000);
    }
}

// 🚀 Initialize application when DOM is ready
let dancifyAdmin = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('💃 Starting Dancify Admin...');
    
    try {
        // Create and initialize main application
        dancifyAdmin = new DancifyAdmin();
        await dancifyAdmin.init();
        
        // Make globally available for debugging
        window.dancifyAdmin = dancifyAdmin;
        
        console.log('🎉 Dancify Admin started successfully');
        
    } catch (error) {
        console.error('💥 Failed to start Dancify Admin:', error);
        
        // Show error to user
        const errorMessage = document.createElement('div');
        errorMessage.className = 'startup-error';
        errorMessage.innerHTML = `
            <h2>❌ Startup Error</h2>
            <p>Failed to initialize Dancify Admin: ${error.message}</p>
            <button onclick="window.location.reload()">🔄 Retry</button>
        `;
        
        document.body.appendChild(errorMessage);
    }
});

// Handle unload
window.addEventListener('beforeunload', () => {
    if (dancifyAdmin) {
        dancifyAdmin.stopConnectionMonitoring();
    }
});