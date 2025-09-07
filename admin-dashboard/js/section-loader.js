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
            
            const config = this.sectionConfig[sectionName];
            await this.loadSectionHTML(sectionName, config.htmlFile);
            await this.initializeSectionFunctionality(sectionName);
            this.activateSection(sectionName);
            
            console.log(`✅ Section ${sectionName} loaded`);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to load section ${sectionName}:`, error);
            return false;
        }
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
        let sectionElement = document.getElementById(sectionName);
        
        if (!sectionElement) {
            sectionElement = document.createElement('section');
            sectionElement.id = sectionName;
            sectionElement.className = 'content-section';
            
            const contentContainer = document.querySelector('.content-container');
            if (contentContainer) {
                contentContainer.appendChild(sectionElement);
            }
        }
        
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
            }
            
        } catch (error) {
            console.error(`❌ Init failed for ${sectionName}:`, error);
        }
    }

    activateSection(sectionName) {
        const allSections = document.querySelectorAll('.content-section');
        allSections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            this.activeSection = sectionName;
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