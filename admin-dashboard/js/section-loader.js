// 💃 Dancify Admin Dashboard - Section Loader
// Handles dynamic loading of HTML sections and their associated JavaScript
// Provides seamless navigation between different admin sections

class DancifySectionLoader {
    constructor() {
        this.loadedSections = new Set();
        this.sectionCache = new Map();
        this.activeSection = null;
        this.loadingPromises = new Map();
        
        // Section configuration - FIXED: Set all jsFile to null to prevent loading errors
        this.sectionConfig = {
            'dashboard': {
                htmlFile: 'sections/dashboard.html',
                jsFile: null, // Dashboard JS is already loaded
                title: 'Dashboard',
                icon: '📊',
                requiresAuth: true
            },
            'users': {
                htmlFile: 'sections/users.html',
                jsFile: null, // FIXED: No separate JS file yet
                title: 'User Management',
                icon: '👥',
                requiresAuth: true
            },
            'move-management': {
                htmlFile: 'sections/move-management.html',
                jsFile: null, // Moves JS is already loaded
                title: 'Move Management',
                icon: '🕺',
                requiresAuth: true
            },
            'dance-style-management': {
                htmlFile: 'sections/dance-style-management.html',
                jsFile: null, // Styles JS is already loaded
                title: 'Dance Style Management',
                icon: '🎭',
                requiresAuth: true
            },
            'move-submissions': {
                htmlFile: 'sections/move-submissions.html',
                jsFile: null, // Submissions JS is already loaded
                title: 'Move Submissions',
                icon: '📹',
                requiresAuth: true
            },
            'choreography': {
                htmlFile: 'sections/choreography.html',
                jsFile: null, // FIXED: No separate JS file yet
                title: 'Choreography Management',
                icon: '🎵',
                requiresAuth: true
            },
            'instructor-applications': {
                htmlFile: 'sections/instructor-applications.html',
                jsFile: null, // FIXED: No separate JS file yet
                title: 'Instructor Applications',
                icon: '🎓',
                requiresAuth: true
            },
            'feedback': {
                htmlFile: 'sections/feedback.html',
                jsFile: null, // FIXED: No separate JS file yet
                title: 'User Feedback',
                icon: '💬',
                requiresAuth: true
            },
            'social-posts': {
                htmlFile: 'sections/social-posts.html',
                jsFile: null, // FIXED: No separate JS file yet
                title: 'Social Posts',
                icon: '📱',
                requiresAuth: true
            },
            'reports': {
                htmlFile: 'sections/reports.html',
                jsFile: null, // FIXED: No separate JS file yet
                title: 'Reports',
                icon: '📈',
                requiresAuth: true
            },
            'analytics': {
                htmlFile: 'sections/analytics.html',
                jsFile: null, // FIXED: No separate JS file yet
                title: 'Analytics',
                icon: '📊',
                requiresAuth: true
            },
            'settings': {
                htmlFile: 'sections/settings.html',
                jsFile: null, // FIXED: No separate JS file yet
                title: 'Settings',
                icon: '⚙️',
                requiresAuth: true
            }
        };
        
        // Track initialization attempts to prevent infinite loops
        this.initializationAttempts = new Map();
        this.maxAttempts = 3;
    }

    // 🚀 Initialize section loader
    init() {
        console.log('📂 Initializing Section Loader...');
        this.setupEventListeners();
        console.log('✅ Section Loader initialized');
    }

    // 📄 Load a specific section
    async loadSection(sectionName) {
        try {
            console.log(`📂 Loading section: ${sectionName}`);
            
            // Validate section exists
            if (!this.sectionConfig[sectionName]) {
                throw new Error(`Unknown section: ${sectionName}`);
            }
            
            const config = this.sectionConfig[sectionName];
            
            // Check authentication if required
            if (config.requiresAuth && !this.checkAuthentication()) {
                throw new Error('Authentication required');
            }
            
            // Check if already loading
            if (this.loadingPromises.has(sectionName)) {
                return await this.loadingPromises.get(sectionName);
            }
            
            // Start loading
            const loadingPromise = this.performSectionLoad(sectionName, config);
            this.loadingPromises.set(sectionName, loadingPromise);
            
            try {
                await loadingPromise;
                
                // Activate section
                this.activateSection(sectionName);
                
                // Update page state
                this.updatePageState(sectionName, config);
                
                console.log(`✅ Section ${sectionName} loaded successfully`);
                return true;
                
            } finally {
                this.loadingPromises.delete(sectionName);
            }
            
        } catch (error) {
            console.error(`❌ Failed to load section ${sectionName}:`, error);
            this.showSectionError(sectionName, error.message);
            return false;
        }
    }

    // 🔧 Perform the actual section loading
    async performSectionLoad(sectionName, config) {
        // Check if section is already loaded and cached
        if (this.loadedSections.has(sectionName) && this.sectionCache.has(sectionName)) {
            console.log(`📋 Using cached section: ${sectionName}`);
            return;
        }
        
        // Load HTML content
        if (config.htmlFile) {
            await this.loadSectionHTML(sectionName, config.htmlFile);
        }
        
        // Load JavaScript if specified - FIXED: Only load if file exists
        if (config.jsFile && !this.isScriptLoaded(config.jsFile)) {
            try {
                await this.loadSectionScript(config.jsFile);
            } catch (error) {
                console.warn(`⚠️ Failed to load optional script ${config.jsFile}, continuing without it`);
                // Don't throw - continue loading the section
            }
        }
        
        // Initialize section-specific functionality
        await this.initializeSectionFunctionality(sectionName);
        
        // Mark as loaded
        this.loadedSections.add(sectionName);
    }

    // 📄 Load section HTML
    async loadSectionHTML(sectionName, htmlFile) {
        try {
            // Check cache first
            if (this.sectionCache.has(sectionName)) {
                this.injectSectionHTML(sectionName, this.sectionCache.get(sectionName));
                return;
            }
            
            console.log(`📄 Loading HTML: ${htmlFile}`);
            
            const response = await fetch(htmlFile);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            
            // Cache the HTML
            this.sectionCache.set(sectionName, html);
            
            // Inject into DOM
            this.injectSectionHTML(sectionName, html);
            
        } catch (error) {
            console.error(`❌ Failed to load HTML for ${sectionName}:`, error);
            // Create fallback content
            this.createFallbackSection(sectionName);
        }
    }

    // 💉 Inject section HTML into DOM
    injectSectionHTML(sectionName, html) {
        let sectionElement = document.getElementById(sectionName);
        
        if (!sectionElement) {
            // Create new section element
            sectionElement = document.createElement('section');
            sectionElement.id = sectionName;
            sectionElement.className = 'content-section';
            
            const contentContainer = document.getElementById('contentContainer');
            if (contentContainer) {
                contentContainer.appendChild(sectionElement);
            }
        }
        
        // Set content
        sectionElement.innerHTML = html;
        
        console.log(`📄 HTML injected for section: ${sectionName}`);
    }

    // 📜 Load section JavaScript
    async loadSectionScript(jsFile) {
        try {
            console.log(`📜 Loading script: ${jsFile}`);
            
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = jsFile;
                script.async = true;
                
                script.onload = () => {
                    console.log(`✅ Script loaded: ${jsFile}`);
                    resolve();
                };
                
                script.onerror = (error) => {
                    console.error(`❌ Failed to load script: ${jsFile}`, error);
                    reject(new Error(`Failed to load script: ${jsFile}`));
                };
                
                document.head.appendChild(script);
            });
            
        } catch (error) {
            console.error(`❌ Script loading error for ${jsFile}:`, error);
            throw error;
        }
    }

    // 🔧 Initialize section-specific functionality
    async initializeSectionFunctionality(sectionName) {
        try {
            // Track initialization attempts
            const attempts = this.initializationAttempts.get(sectionName) || 0;
            if (attempts >= this.maxAttempts) {
                console.warn(`⚠️ Max initialization attempts reached for ${sectionName}`);
                return;
            }
            
            this.initializationAttempts.set(sectionName, attempts + 1);
            
            // Initialize based on section type
            switch (sectionName) {
                case 'dashboard':
                    if (window.dancifyAdmin?.modules?.dashboard) {
                        await window.dancifyAdmin.modules.dashboard.refresh();
                    }
                    break;
                    
                case 'move-management':
                    if (window.moveManager && typeof window.moveManager.init === 'function') {
                        await window.moveManager.init();
                    }
                    break;
                    
                case 'dance-style-management':
                    if (window.styleManager && typeof window.styleManager.init === 'function') {
                        await window.styleManager.init();
                    }
                    break;
                    
                case 'move-submissions':
                    if (window.submissionManager && typeof window.submissionManager.init === 'function') {
                        await window.submissionManager.init();
                    }
                    break;
                    
                case 'users':
                    // FIXED: Users section works without separate JS file
                    console.log(`ℹ️ Users section loaded (no separate JS required)`);
                    break;
                    
                case 'choreography':
                case 'instructor-applications':
                case 'feedback':
                case 'social-posts':
                case 'reports':
                case 'analytics':
                case 'settings':
                    // FIXED: These sections work with HTML only for now
                    console.log(`ℹ️ ${sectionName} section loaded (no separate JS required)`);
                    break;
                    
                default:
                    // For other sections, try to find and call their init functions
                    await this.initializeGenericSection(sectionName);
                    break;
            }
            
            console.log(`🔧 Section functionality initialized: ${sectionName}`);
            
        } catch (error) {
            console.error(`❌ Failed to initialize section functionality for ${sectionName}:`, error);
            // Don't throw - allow section to load without full functionality
        }
    }

    // 🔧 Initialize generic section functionality
    async initializeGenericSection(sectionName) {
        // Try to find a manager or init function
        const possibleNames = [
            `${sectionName}Manager`,
            `${sectionName.replace(/-/g, '')}Manager`,
            `${sectionName.replace(/-/g, '').toLowerCase()}Manager`
        ];
        
        for (const name of possibleNames) {
            if (window[name] && typeof window[name].init === 'function') {
                await window[name].init();
                console.log(`🔧 Initialized ${name} for section ${sectionName}`);
                return;
            }
        }
        
        // Try to find standalone init functions
        const initFunctionNames = [
            `init${sectionName.replace(/-/g, '').replace(/^./, str => str.toUpperCase())}`,
            `initialize${sectionName.replace(/-/g, '').replace(/^./, str => str.toUpperCase())}`
        ];
        
        for (const funcName of initFunctionNames) {
            if (typeof window[funcName] === 'function') {
                await window[funcName]();
                console.log(`🔧 Called ${funcName} for section ${sectionName}`);
                return;
            }
        }
        
        console.log(`ℹ️ No specific initialization found for section: ${sectionName}`);
    }

    // ✨ Activate section (show/hide)
    activateSection(sectionName) {
        // Hide all sections
        const allSections = document.querySelectorAll('.content-section');
        allSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.activeSection = sectionName;
        }
        
        // Update navigation
        this.updateNavigation(sectionName);
    }

    // 🧭 Update navigation state
    updateNavigation(sectionName) {
        // Update sidebar navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const isActive = item.dataset.section === sectionName;
            item.classList.toggle('active', isActive);
        });
    }

    // 📊 Update page state
    updatePageState(sectionName, config) {
        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = config.title;
        }
        
        // Update document title
        document.title = `💃 Dancify Admin - ${config.title}`;
        
        // Update URL hash without triggering navigation
        if (window.location.hash !== `#${sectionName}`) {
            history.replaceState(null, null, `#${sectionName}`);
        }
    }

    // 🔒 Check authentication
    checkAuthentication() {
        // For now, always return true
        // In production, check actual auth state
        return true;
    }

    // 📜 Check if script is already loaded
    isScriptLoaded(jsFile) {
        const scripts = document.querySelectorAll('script[src]');
        return Array.from(scripts).some(script => script.src.includes(jsFile));
    }

    // 🆘 Create fallback section
    createFallbackSection(sectionName) {
        const config = this.sectionConfig[sectionName];
        const fallbackHTML = `
            <div class="section-fallback">
                <div class="fallback-content">
                    <div class="fallback-icon">${config.icon}</div>
                    <h2>${config.title}</h2>
                    <p>This section is currently unavailable.</p>
                    <button class="btn btn-primary" onclick="sectionLoader.loadSection('${sectionName}')">
                        🔄 Retry Loading
                    </button>
                </div>
            </div>
        `;
        
        this.injectSectionHTML(sectionName, fallbackHTML);
    }

    // ❌ Show section error
    showSectionError(sectionName, errorMessage) {
        const config = this.sectionConfig[sectionName] || { title: sectionName, icon: '⚠️' };
        const errorHTML = `
            <div class="section-error">
                <div class="error-content">
                    <div class="error-icon">⚠️</div>
                    <h2>Failed to Load ${config.title}</h2>
                    <p class="error-message">${this.escapeHtml(errorMessage)}</p>
                    <div class="error-actions">
                        <button class="btn btn-primary" onclick="sectionLoader.loadSection('${sectionName}')">
                            🔄 Retry
                        </button>
                        <button class="btn btn-secondary" onclick="sectionLoader.loadSection('dashboard')">
                            🏠 Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.injectSectionHTML(sectionName, errorHTML);
        this.activateSection(sectionName);
    }

    // 🎯 Setup event listeners
    setupEventListeners() {
        // Handle browser back/forward navigation
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1);
            if (hash && this.sectionConfig[hash]) {
                this.loadSection(hash);
            }
        });
        
        // Handle navigation clicks (delegated)
        document.addEventListener('click', (event) => {
            const navItem = event.target.closest('[data-section]');
            if (navItem) {
                event.preventDefault();
                const sectionName = navItem.dataset.section;
                this.loadSection(sectionName);
            }
        });
    }

    // 🧹 Cleanup section resources
    cleanupSection(sectionName) {
        try {
            // Call section-specific cleanup if available
            switch (sectionName) {
                case 'move-management':
                    if (window.moveManager && typeof window.moveManager.cleanup === 'function') {
                        window.moveManager.cleanup();
                    }
                    break;
                    
                case 'dance-style-management':
                    if (window.styleManager && typeof window.styleManager.cleanup === 'function') {
                        window.styleManager.cleanup();
                    }
                    break;
                    
                case 'move-submissions':
                    if (window.submissionManager && typeof window.submissionManager.cleanup === 'function') {
                        window.submissionManager.cleanup();
                    }
                    break;
            }
            
            console.log(`🧹 Cleaned up section: ${sectionName}`);
            
        } catch (error) {
            console.error(`❌ Failed to cleanup section ${sectionName}:`, error);
        }
    }

    // 🔄 Refresh current section
    async refreshCurrentSection() {
        if (this.activeSection) {
            await this.loadSection(this.activeSection);
        }
    }

    // 📋 Preload section
    async preloadSection(sectionName) {
        if (!this.loadedSections.has(sectionName)) {
            try {
                await this.performSectionLoad(sectionName, this.sectionConfig[sectionName]);
                console.log(`📋 Preloaded section: ${sectionName}`);
            } catch (error) {
                console.warn(`⚠️ Failed to preload section ${sectionName}:`, error);
            }
        }
    }

    // 🔍 Get section info
    getSectionInfo(sectionName) {
        return {
            config: this.sectionConfig[sectionName],
            isLoaded: this.loadedSections.has(sectionName),
            isActive: this.activeSection === sectionName,
            isCached: this.sectionCache.has(sectionName)
        };
    }

    // 📊 Get loader statistics
    getStats() {
        return {
            totalSections: Object.keys(this.sectionConfig).length,
            loadedSections: this.loadedSections.size,
            cachedSections: this.sectionCache.size,
            activeSection: this.activeSection,
            loadingPromises: this.loadingPromises.size
        };
    }

    // 🔧 Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 🧹 Cleanup
    cleanup() {
        // Clear all caches and states
        this.loadedSections.clear();
        this.sectionCache.clear();
        this.loadingPromises.clear();
        this.initializationAttempts.clear();
        this.activeSection = null;
        
        console.log('🧹 Section loader cleanup completed');
    }
}

// 🌐 Export for global use
window.DancifySectionLoader = DancifySectionLoader;

// Create global instance
window.sectionLoader = new DancifySectionLoader();

console.log('📂 Dancify Section Loader loaded');