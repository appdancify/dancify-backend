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
            
            // Prevent duplicate loading of the same section
            if (this.loadingPromises.has(sectionName)) {
                console.log(`⏳ Section ${sectionName} already loading, waiting...`);
                return await this.loadingPromises.get(sectionName);
            }
            
            // Create loading promise
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
        
        // Only load HTML if section doesn't exist or hasn't been loaded
        if (!this.loadedSections.has(sectionName)) {
            await this.loadSectionHTML(sectionName, config.htmlFile);
            this.loadedSections.add(sectionName);
        }
        
        await this.initializeSectionFunctionality(sectionName);
        this.activateSection(sectionName);
        
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
        }
    }

    injectSectionHTML(sectionName, html) {
        // CRITICAL FIX: Remove any existing duplicate sections first
        const existingSections = document.querySelectorAll(`#${sectionName}`);
        if (existingSections.length > 1) {
            console.log(`🗑️ Removing ${existingSections.length - 1} duplicate sections for ${sectionName}`);
            for (let i = 1; i < existingSections.length; i++) {
                existingSections[i].remove();
            }
        }
        
        let sectionElement = document.getElementById(sectionName);
        
        if (!sectionElement) {
            // Only create if it doesn't exist
            sectionElement = document.createElement('section');
            sectionElement.id = sectionName;
            sectionElement.className = 'content-section';
            
            const contentContainer = document.querySelector('.content-container');
            if (contentContainer) {
                contentContainer.appendChild(sectionElement);
            }
            console.log(`📄 Created new section: ${sectionName}`);
        } else {
            console.log(`📄 Reusing existing section: ${sectionName}`);
        }
        
        // Always update the HTML content
        sectionElement.innerHTML = html;
        console.log(`📄 HTML injected for section: ${sectionName}`);
    }

    async initializeSectionFunctionality(sectionName) {
        try {
            console.log(`🔧 Initializing: ${sectionName}`);
            
            switch (sectionName) {
                case 'move-management':
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
                    if (window.DanceStyleManager && window.apiClient) {
                        if (!window.danceStyleManager) {
                            window.danceStyleManager = new window.DanceStyleManager(window.apiClient);
                        }
                        if (typeof window.danceStyleManager.init === 'function') {
                            await window.danceStyleManager.init();
                        }
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
                    }
                    break;
            }
            
        } catch (error) {
            console.error(`❌ Init failed for ${sectionName}:`, error);
        }
    }

    activateSection(sectionName) {
        // Hide ALL sections first - this prevents duplicate active sections
        const allSections = document.querySelectorAll('.content-section');
        allSections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        
        // Show only the target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            this.activeSection = sectionName;
            console.log(`📂 Activated section: ${sectionName}`);
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const sectionLink = e.target.closest('[data-section]');
            if (sectionLink) {
                e.preventDefault();
                const sectionName = sectionLink.dataset.section;
                this.loadSection(sectionName);
            }
        });
    }
}

window.DancifySectionLoader = DancifySectionLoader;
console.log('📂 Section Loader loaded');