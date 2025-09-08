class DancifySectionLoader {
    constructor() {
        this.loadedSections = new Set();
        this.sectionCache = new Map();
        this.activeSection = null;
        this.loadingPromises = new Map();
        this.initializationAttempts = new Map();
        this.maxAttempts = 3;
        
        this.sectionConfig = {
            'dashboard': {
                htmlFile: 'sections/dashboard.html',
                title: 'Dashboard',
                icon: '📊'
            },
            'move-management': {
                htmlFile: 'sections/move-management.html',
                title: 'Move Management',
                icon: '🕺'
            },
            'dance-style-management': {
                htmlFile: 'sections/dance-style-management.html',
                title: 'Dance Style Management',
                icon: '🎭'
            },
            'users': {
                htmlFile: 'sections/users.html',
                title: 'User Management',
                icon: '👥'
            }
        };
    }

    init() {
        console.log('📂 Section Loader initialized');
        this.setupEventListeners();
    }

    async loadSection(sectionName) {
        try {
            console.log(`📂 Loading section: ${sectionName}`);
            
            if (!this.sectionConfig[sectionName]) {
                throw new Error(`Unknown section: ${sectionName}`);
            }
            
            // Check if section already exists and is already initialized
            const existingSection = document.getElementById(sectionName);
            if (existingSection && this.loadedSections.has(sectionName)) {
                console.log(`📂 Section ${sectionName} already loaded, just activating...`);
                this.activateSection(sectionName);
                return true;
            }
            
            // Check if already loading to prevent race conditions
            if (this.loadingPromises.has(sectionName)) {
                console.log(`⏳ Section ${sectionName} already loading, waiting...`);
                return await this.loadingPromises.get(sectionName);
            }
            
            // Start loading process
            const loadingPromise = this.performSectionLoad(sectionName);
            this.loadingPromises.set(sectionName, loadingPromise);
            
            try {
                const result = await loadingPromise;
                this.loadingPromises.delete(sectionName);
                return result;
            } catch (error) {
                this.loadingPromises.delete(sectionName);
                throw error;
            }
            
        } catch (error) {
            console.error(`❌ Failed to load section ${sectionName}:`, error);
            return false;
        }
    }

    async performSectionLoad(sectionName) {
        const config = this.sectionConfig[sectionName];
        await this.loadSectionHTML(sectionName, config.htmlFile);
        await this.initializeSectionFunctionality(sectionName);
        this.activateSection(sectionName);
        this.loadedSections.add(sectionName);
        
        console.log(`✅ Section ${sectionName} loaded`);
        return true;
    }

    async loadSectionHTML(sectionName, htmlFile) {
        try {
            console.log(`📄 Loading HTML: ${htmlFile}`);
            
            const response = await fetch(htmlFile);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const html = await response.text();
            this.injectSectionHTML(sectionName, html);
            
        } catch (error) {
            console.error(`❌ Failed to load HTML for ${sectionName}:`, error);
            throw error;
        }
    }

    injectSectionHTML(sectionName, html) {
        // CRITICAL FIX: Remove any existing duplicate sections first
        const existingSections = document.querySelectorAll(`#${sectionName}`);
        if (existingSections.length > 1) {
            console.log(`🔧 Removing ${existingSections.length - 1} duplicate sections for ${sectionName}`);
            // Keep only the first section, remove duplicates
            for (let i = 1; i < existingSections.length; i++) {
                existingSections[i].remove();
            }
        }
        
        let sectionElement = document.getElementById(sectionName);
        
        if (!sectionElement) {
            console.log(`📄 Created new section: ${sectionName}`);
            sectionElement = document.createElement('section');
            sectionElement.id = sectionName;
            sectionElement.className = 'content-section';
            
            const contentContainer = document.querySelector('.content-container');
            if (contentContainer) {
                contentContainer.appendChild(sectionElement);
            }
        }
        
        // Always update the HTML content
        sectionElement.innerHTML = html;
        console.log(`📄 HTML injected for section: ${sectionName}`);
    }

    async initializeSectionFunctionality(sectionName) {
        try {
            console.log(`🔧 Initializing: ${sectionName}`);
            
            // Track initialization attempts to prevent infinite loops
            const attempts = this.initializationAttempts.get(sectionName) || 0;
            if (attempts >= this.maxAttempts) {
                console.warn(`⚠️ Max initialization attempts reached for ${sectionName}`);
                return;
            }
            this.initializationAttempts.set(sectionName, attempts + 1);
            
            switch (sectionName) {
                case 'move-management':
                    if (window.MoveManager && window.apiClient) {
                        if (!window.moveManager) {
                            window.moveManager = new window.MoveManager(window.apiClient);
                        }
                        if (typeof window.moveManager.init === 'function') {
                            await window.moveManager.init();
                        }
                    } else {
                        console.warn('⚠️ MoveManager or apiClient not available');
                    }
                    break;
                    
                case 'dance-style-management':
                    if (window.DanceStyleManager && window.apiClient) {
                        if (!window.danceStyleManager) {
                            window.danceStyleManager = new window.DanceStyleManager(window.apiClient);
                        }
                        if (typeof window.danceStyleManager.init === 'function') {
                            await window.danceStyleManager.init();
                        }
                    } else {
                        console.warn('⚠️ DanceStyleManager or apiClient not available');
                    }
                    break;
                    
                case 'dashboard':
                    if (window.DancifyDashboard && window.apiClient) {
                        if (!window.dashboardManager) {
                            window.dashboardManager = new window.DancifyDashboard(window.apiClient);
                        }
                        if (typeof window.dashboardManager.init === 'function') {
                            await window.dashboardManager.init();
                        }
                    } else {
                        console.warn('⚠️ DancifyDashboard or apiClient not available');
                    }
                    break;
                    
                case 'users':
                    if (window.UserManager && window.apiClient) {
                        if (!window.userManager) {
                            window.userManager = new window.UserManager(window.apiClient);
                        }
                        if (typeof window.userManager.init === 'function') {
                            await window.userManager.init();
                        }
                    } else {
                        console.warn('⚠️ UserManager or apiClient not available');
                    }
                    break;
                    
                default:
                    console.log(`ℹ️ No specific initialization for ${sectionName}`);
                    break;
            }
            
            // Reset initialization attempts on success
            this.initializationAttempts.delete(sectionName);
            
        } catch (error) {
            console.error(`❌ Init failed for ${sectionName}:`, error);
            // Don't throw - allow section to load even if initialization fails
        }
    }

    activateSection(sectionName) {
        // Hide all sections first
        const allSections = document.querySelectorAll('.content-section');
        allSections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            this.activeSection = sectionName;
            console.log(`📂 Activated section: ${sectionName}`);
            
            // Update navigation state
            this.updateNavigationState(sectionName);
        } else {
            console.error(`❌ Section ${sectionName} not found for activation`);
        }
    }

    updateNavigationState(sectionName) {
        // Update navigation item states
        const navItems = document.querySelectorAll('[data-section]');
        navItems.forEach(item => {
            if (item.dataset.section === sectionName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const sectionLink = e.target.closest('[data-section]');
            if (sectionLink) {
                e.preventDefault();
                const sectionName = sectionLink.dataset.section;
                console.log(`🔗 Navigation clicked: ${sectionName}`);
                this.loadSection(sectionName);
            }
        });
    }

    // Utility methods
    isLoading(sectionName) {
        return this.loadingPromises.has(sectionName);
    }

    isLoaded(sectionName) {
        return this.loadedSections.has(sectionName);
    }

    getCurrentSection() {
        return this.activeSection;
    }

    // Clear section cache and force reload
    reloadSection(sectionName) {
        this.loadedSections.delete(sectionName);
        this.initializationAttempts.delete(sectionName);
        
        const existingSection = document.getElementById(sectionName);
        if (existingSection) {
            existingSection.remove();
        }
        
        return this.loadSection(sectionName);
    }

    // Debug method to check section states
    debugSectionStates() {
        console.log('=== SECTION DEBUG INFO ===');
        console.log('Active section:', this.activeSection);
        console.log('Loaded sections:', Array.from(this.loadedSections));
        console.log('Loading promises:', Array.from(this.loadingPromises.keys()));
        console.log('DOM sections:');
        
        document.querySelectorAll('.content-section').forEach(section => {
            const rect = section.getBoundingClientRect();
            console.log(`  ${section.id}: display=${getComputedStyle(section).display}, active=${section.classList.contains('active')}, rect=${rect.width}x${rect.height}`);
        });
    }
}

window.DancifySectionLoader = DancifySectionLoader;
console.log('📂 Section Loader loaded');