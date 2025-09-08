// 💃 Dancify Admin Dashboard - Section Loader
// Dynamic section loading with proper initialization - FINAL FIXED VERSION

class DancifySectionLoader {
    constructor() {
        this.loadedSections = new Set();
        this.sectionCache = new Map();
        this.activeSection = null;
        this.loadingPromises = new Map();
        this.initializationAttempts = new Map();
        this.maxAttempts = 3;
        this.isProcessingClick = false; // Prevent rapid clicks
        
        this.sectionConfig = {
            'dashboard': {
                htmlFile: '/admin/sections/dashboard.html',
                title: 'Dashboard',
                icon: '📊'
            },
            'move-management': {
                htmlFile: '/admin/sections/move-management.html',
                title: 'Move Management',
                icon: '🕺'
            },
            'dance-style-management': {
                htmlFile: '/admin/sections/dance-style-management.html',
                title: 'Dance Style Management',
                icon: '🎭'
            },
            'users': {
                htmlFile: '/admin/sections/users.html',
                title: 'User Management',
                icon: '👥'
            }
        };
    }

    init() {
        console.log('📂 Section Loader initialized');
        this.setupEventListeners();
        this.cleanupExistingDuplicates(); // Clean up any existing duplicates
    }

    // Clean up any existing duplicate sections on initialization
    cleanupExistingDuplicates() {
        const sectionIds = Object.keys(this.sectionConfig);
        sectionIds.forEach(sectionId => {
            const sections = document.querySelectorAll(`#${sectionId}`);
            if (sections.length > 1) {
                console.log(`🧹 Cleaning up ${sections.length - 1} duplicate sections for ${sectionId}`);
                // Remove all but the first section
                for (let i = 1; i < sections.length; i++) {
                    sections[i].remove();
                }
            }
        });
    }

    async loadSection(sectionName) {
        // Prevent rapid clicking from creating issues
        if (this.isProcessingClick) {
            console.log(`⏳ Already processing a section load, ignoring ${sectionName}`);
            return false;
        }

        try {
            this.isProcessingClick = true;
            console.log(`📂 Loading section: ${sectionName}`);
            
            if (!this.sectionConfig[sectionName]) {
                throw new Error(`Unknown section: ${sectionName}`);
            }
          
            // CRITICAL: Always clean up duplicates before proceeding
            this.removeDuplicateSections(sectionName);
            
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
        } finally {
            this.isProcessingClick = false;
        }
    }

    // CRITICAL: Remove duplicate sections before any operation
    removeDuplicateSections(sectionName) {
        const sections = document.querySelectorAll(`#${sectionName}`);
        if (sections.length > 1) {
            console.log(`🧹 Found ${sections.length} duplicate sections for ${sectionName}, removing extras`);
            
            // Keep the first section, remove the rest
            for (let i = 1; i < sections.length; i++) {
                sections[i].remove();
            }
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
        // CRITICAL: Always ensure no duplicates exist before injection
        this.removeDuplicateSections(sectionName);
        
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
        
        // CRITICAL: Final duplicate check after injection
        setTimeout(() => {
            this.removeDuplicateSections(sectionName);
        }, 100);
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
                    // CRITICAL FIX: Wait longer for DOM to be fully ready AND duplicates removed
                    console.log('🔄 Re-initializing existing MoveManager with new DOM...');
                    
                    // Wait longer for DOM to be fully injected and rendered
                    await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay
                    
                    // Remove duplicates FIRST before checking for elements
                    this.removeDuplicateSections(sectionName);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Verify DOM elements exist before proceeding
                    const requiredElements = ['createMoveBtn', 'moveSearchInput', 'movesGrid'];
                    let elementsReady = false;
                    let retries = 0;
                    const maxRetries = 15; // Increased retries
                    
                    while (!elementsReady && retries < maxRetries) {
                        elementsReady = requiredElements.every(id => {
                            const element = document.getElementById(id);
                            if (!element) {
                                console.log(`⏳ Waiting for element: ${id} (attempt ${retries + 1})`);
                                return false;
                            }
                            return true;
                        });
                        
                        if (!elementsReady) {
                            retries++;
                            await new Promise(resolve => setTimeout(resolve, 150)); // Longer wait between retries
                        }
                    }
                    
                    if (!elementsReady) {
                        console.error('❌ Required DOM elements not found after waiting');
                        // Check what elements we actually have
                        console.log('🔍 Available elements:', {
                            createMoveBtn: !!document.getElementById('createMoveBtn'),
                            moveSearchInput: !!document.getElementById('moveSearchInput'),
                            movesGrid: !!document.getElementById('movesGrid'),
                            allButtons: document.querySelectorAll('button').length,
                            allInputs: document.querySelectorAll('input').length
                        });
                    }
                    
                    if (window.moveManager) {
                        try {
                            console.log('🎯 MoveManager exists, re-initializing...');
                            
                            // Wait a bit more before setting up event listeners
                            await new Promise(resolve => setTimeout(resolve, 200));
                            
                            window.moveManager.setupEventListeners();
                            window.moveManager.renderMoves();
                            window.moveManager.updateMoveStats();
                            console.log('✅ MoveManager re-initialized successfully');
                        } catch (error) {
                            console.error('❌ Error re-initializing MoveManager:', error);
                            // Fallback: create new instance
                            window.moveManager = new window.MoveManager();
                            await window.moveManager.init();
                        }
                    } else if (window.MoveManager) {
                        console.log('🆕 Creating new MoveManager instance...');
                        window.moveManager = new window.MoveManager();
                        await window.moveManager.init();
                        console.log('✅ New MoveManager instance created');
                    } else {
                        console.warn('⚠️ MoveManager class not available');
                    }
                    break;
                    
                case 'dance-style-management':
                    await new Promise(resolve => setTimeout(resolve, 500));
                    this.removeDuplicateSections(sectionName);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    if (window.danceStyleManager) {
                        console.log('🔄 Re-initializing existing DanceStyleManager...');
                        try {
                            await new Promise(resolve => setTimeout(resolve, 200));
                            window.danceStyleManager.setupEventListeners();
                            window.danceStyleManager.renderDanceStyles();
                            window.danceStyleManager.updateStyleStats();
                            console.log('✅ DanceStyleManager re-initialized successfully');
                        } catch (error) {
                            console.error('❌ Error re-initializing DanceStyleManager:', error);
                            window.danceStyleManager = new window.DanceStyleManager();
                            await window.danceStyleManager.init();
                        }
                    } else if (window.DanceStyleManager) {
                        console.log('🆕 Creating new DanceStyleManager instance...');
                        window.danceStyleManager = new window.DanceStyleManager();
                        await window.danceStyleManager.init();
                        console.log('✅ New DanceStyleManager instance created');
                    } else {
                        console.warn('⚠️ DanceStyleManager class not available');
                    }
                    break;
                    
                case 'dashboard':
                    await new Promise(resolve => setTimeout(resolve, 300));
                    this.removeDuplicateSections(sectionName);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    if (window.DancifyDashboard && window.apiClient) {
                        if (!window.dashboardManager) {
                            window.dashboardManager = new window.DancifyDashboard(window.apiClient);
                        }
                        if (typeof window.dashboardManager.init === 'function') {
                            await window.dashboardManager.init();
                            console.log('✅ Dashboard initialized successfully');
                        }
                    } else {
                        console.warn('⚠️ DancifyDashboard or apiClient not available');
                    }
                    break;
                    
                case 'users':
                    await new Promise(resolve => setTimeout(resolve, 300));
                    this.removeDuplicateSections(sectionName);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    if (window.UserManager && window.apiClient) {
                        if (!window.userManager) {
                            window.userManager = new window.UserManager(window.apiClient);
                        }
                        if (typeof window.userManager.init === 'function') {
                            await window.userManager.init();
                            console.log('✅ User manager initialized successfully');
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
        // Use a more specific event listener with debouncing
        document.addEventListener('click', (e) => {
            const sectionLink = e.target.closest('[data-section]');
            if (sectionLink && !this.isProcessingClick) {
                e.preventDefault();
                e.stopPropagation(); // Prevent event bubbling
                
                const sectionName = sectionLink.dataset.section;
                console.log(`🔗 Navigation clicked: ${sectionName}`);
                this.loadSection(sectionName);

            }
        }, true); // Use capture phase to catch events early
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
        
        // Remove all instances of this section
        const sections = document.querySelectorAll(`#${sectionName}`);
        sections.forEach(section => section.remove());
        
        return this.loadSection(sectionName);
    }

    // Emergency cleanup method
    emergencyCleanup() {
        console.log('🚨 Running emergency cleanup...');
        
        // Remove all duplicate sections
        Object.keys(this.sectionConfig).forEach(sectionId => {
            this.removeDuplicateSections(sectionId);
        });
        
        // Reset all state
        this.loadingPromises.clear();
        this.isProcessingClick = false;
        
        console.log('🧹 Emergency cleanup completed');
    }

    // Debug method to check section states
    debugSectionStates() {
        console.log('=== SECTION DEBUG INFO ===');
        console.log('Active section:', this.activeSection);
        console.log('Loaded sections:', Array.from(this.loadedSections));
        console.log('Loading promises:', Array.from(this.loadingPromises.keys()));
        console.log('Processing click:', this.isProcessingClick);
        console.log('DOM sections:');
        
        Object.keys(this.sectionConfig).forEach(sectionId => {
            const sections = document.querySelectorAll(`#${sectionId}`);
            console.log(`  ${sectionId}: ${sections.length} instances`);
            
            sections.forEach((section, index) => {
                const rect = section.getBoundingClientRect();
                const display = getComputedStyle(section).display;
                const active = section.classList.contains('active');
                console.log(`    [${index}] display=${display}, active=${active}, rect=${rect.width}x${rect.height}`);
            });
        });
    }
}

window.DancifySectionLoader = DancifySectionLoader;
console.log('📂 Section Loader loaded');