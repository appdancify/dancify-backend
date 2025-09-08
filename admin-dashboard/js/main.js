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
        
        console.log('💃 Dancify Admin initializing...');
    }

    async init() {
        try {
            console.log('🔧 Starting Dancify Admin initialization...');
            
            await this.initializeModules();
            this.setupGlobalEventListeners();
            await this.loadDefaultSection();
            
            this.isInitialized = true;
            console.log('✅ Dancify Admin initialized successfully');
            
        } catch (error) {
            console.error('❌ Dancify Admin initialization failed:', error);
            this.showErrorMessage('Application failed to initialize: ' + error.message);
        }
    }

    async initializeModules() {
        try {
            console.log('🔧 Loading core components...');
            
            // Initialize API client first
            if (window.DancifyAPI) {
                this.components.api = new window.DancifyAPI();
                await this.components.api.init();
                window.apiClient = this.components.api;
                console.log('✅ API client initialized successfully');
            } else {
                console.warn('⚠️ DancifyAPI class not available');
            }
            
            // Initialize navigation system
            if (window.DancifyNavigation) {
                this.components.navigation = new window.DancifyNavigation();
                this.components.navigation.init();
                window.navigationManager = this.components.navigation;
                console.log('✅ Navigation system initialized successfully');
            } else {
                console.warn('⚠️ DancifyNavigation class not available');
            }
            
            // Initialize section loader
            if (window.DancifySectionLoader) {
                this.components.sectionLoader = new window.DancifySectionLoader();
                this.components.sectionLoader.init();
                window.sectionLoader = this.components.sectionLoader;
                console.log('✅ Section loader initialized successfully');
            } else {
                console.warn('⚠️ DancifySectionLoader class not available, creating fallback');
                this.createFallbackSectionLoader();
            }
            
            // Initialize dashboard
            if (window.DancifyDashboard) {
                this.components.dashboard = new window.DancifyDashboard();
                console.log('✅ Dashboard component ready');
            } else {
                console.warn('⚠️ DancifyDashboard class not available');
            }
            
            console.log('✅ Core components loaded');
            
        } catch (error) {
            console.error('❌ Module initialization failed:', error);
            // Don't throw - continue with fallback
        }
    }

    createFallbackSectionLoader() {
        // Create a minimal fallback section loader
        this.components.sectionLoader = {
            loadSection: async (sectionName) => {
                console.log(`📂 Fallback loading: ${sectionName}`);
                return this.fallbackLoadSection(sectionName);
            },
            init: () => console.log('📂 Fallback section loader initialized')
        };
        window.sectionLoader = this.components.sectionLoader;
    }

    async fallbackLoadSection(sectionName) {
        try {
            const contentContainer = document.querySelector('.content-container');
            if (!contentContainer) return false;

            // Hide all sections
            const allSections = document.querySelectorAll('.content-section');
            allSections.forEach(section => {
                section.style.display = 'none';
            });

            // Show or create target section
            let targetSection = document.getElementById(sectionName);
            if (!targetSection) {
                targetSection = document.createElement('section');
                targetSection.id = sectionName;
                targetSection.className = 'content-section';
                contentContainer.appendChild(targetSection);
            }

            // Load content based on section
            switch (sectionName) {
                case 'dashboard':
                    targetSection.innerHTML = `
                        <div class="dashboard-section">
                            <h1>Dashboard</h1>
                            <p>Dashboard is loading...</p>
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <h3>Total Moves</h3>
                                    <div class="value">Loading...</div>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'move-management':
                    targetSection.innerHTML = `
                        <div class="move-management-section">
                            <h1>Move Management</h1>
                            <p>Move management is loading...</p>
                            <button class="btn btn-primary" onclick="alert('Move management functionality coming soon!')">
                                ➕ Add Move
                            </button>
                        </div>
                    `;
                    // Try to initialize move manager
                    if (window.MoveManager && window.apiClient) {
                        if (!window.moveManager) {
                            window.moveManager = new window.MoveManager(window.apiClient);
                        }
                        if (typeof window.moveManager.init === 'function') {
                            await window.moveManager.init();
                        }
                    }
                    break;
                    
                case 'dance-style-management':
                    targetSection.innerHTML = `
                        <div class="dance-style-management-section">
                            <h1>🎭 Dance Style Management</h1>
                            <p>Dance style management is loading...</p>
                            <button class="btn btn-primary" onclick="alert('Dance style management functionality coming soon!')">
                                ➕ Add Dance Style
                            </button>
                        </div>
                    `;
                    // Try to initialize dance style manager
                    if (window.DanceStyleManager && window.apiClient) {
                        if (!window.danceStyleManager) {
                            window.danceStyleManager = new window.DanceStyleManager(window.apiClient);
                        }
                        if (typeof window.danceStyleManager.init === 'function') {
                            await window.danceStyleManager.init();
                        }
                    }
                    break;
                    
                default:
                    targetSection.innerHTML = `
                        <div class="section-placeholder">
                            <h1>${sectionName.replace('-', ' ').toUpperCase()}</h1>
                            <p>This section is under development.</p>
                        </div>
                    `;
                    break;
            }

            targetSection.style.display = 'block';
            this.currentSection = sectionName;
            
            // Update navigation
            this.updateNavigationState(sectionName);
            
            return true;
            
        } catch (error) {
            console.error(`❌ Fallback load failed for ${sectionName}:`, error);
            return false;
        }
    }

    async loadDefaultSection() {
        try {
            console.log('📊 Loading default dashboard section...');
            
            if (this.components.sectionLoader) {
                await this.components.sectionLoader.loadSection('dashboard');
                console.log('✅ Default section loaded successfully');
            } else {
                console.log('⚠️ Using fallback section loading');
                await this.fallbackLoadSection('dashboard');
            }
            
        } catch (error) {
            console.error('❌ Failed to load default section:', error);
            this.showErrorMessage('Failed to load dashboard: ' + error.message);
        }
    }

    setupGlobalEventListeners() {
        console.log('🔧 Setting up global event listeners...');
        
        // REMOVED: Duplicate navigation event listener
        // The section loader already handles navigation clicks
        // This was causing duplicate sections to be created
        
        console.log('✅ Global event listeners setup completed');
    }

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

    showErrorMessage(message) {
        console.error('🚨 Error:', message);
        
        const messageContainer = document.body;
        const messageEl = document.createElement('div');
        messageEl.className = 'message message-error';
        messageEl.innerHTML = `
            <span class="message-icon">❌</span>
            <span class="message-text">${message}</span>
            <button class="message-close" onclick="this.parentElement.remove()">✕</button>
        `;
        
        messageContainer.appendChild(messageEl);
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }
}

// Initialize the application
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

console.log('💃 Dancify Admin main script loaded');