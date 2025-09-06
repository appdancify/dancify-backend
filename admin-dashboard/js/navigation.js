// 💃 Dancify Admin Dashboard - Navigation System
// Handles sidebar navigation, mobile menu, breadcrumbs, and navigation state
// Provides smooth transitions and responsive navigation experience

class DancifyNavigation {
    constructor() {
        this.isMobileMenuOpen = false;
        this.currentSection = 'dashboard';
        this.navigationHistory = [];
        this.maxHistoryLength = 10;
        this.isAnimating = false;
        
        // Navigation structure with metadata
        this.navigationStructure = {
            main: {
                title: 'Main',
                items: [
                    {
                        id: 'dashboard',
                        title: 'Dashboard',
                        icon: '📊',
                        section: 'dashboard',
                        description: 'Overview and analytics'
                    },
                    {
                        id: 'users',
                        title: 'Users',
                        icon: '👥',
                        section: 'users',
                        description: 'User management and profiles'
                    }
                ]
            },
            content: {
                title: 'Content Management',
                items: [
                    {
                        id: 'move-management',
                        title: 'Move Management',
                        icon: '🕺',
                        section: 'move-management',
                        description: 'Create and manage dance moves'
                    },
                    {
                        id: 'dance-style-management',
                        title: 'Dance Styles',
                        icon: '🎭',
                        section: 'dance-style-management',
                        description: 'Manage dance categories'
                    },
                    {
                        id: 'move-submissions',
                        title: 'Move Submissions',
                        icon: '📹',
                        section: 'move-submissions',
                        description: 'Review user video submissions'
                    },
                    {
                        id: 'choreography',
                        title: 'Choreography',
                        icon: '🎵',
                        section: 'choreography',
                        description: 'Manage choreography sequences'
                    }
                ]
            },
            community: {
                title: 'Community',
                items: [
                    {
                        id: 'instructor-applications',
                        title: 'Instructor Applications',
                        icon: '🎓',
                        section: 'instructor-applications',
                        description: 'Review instructor applications'
                    },
                    {
                        id: 'feedback',
                        title: 'Feedback',
                        icon: '💬',
                        section: 'feedback',
                        description: 'User feedback and reviews'
                    },
                    {
                        id: 'social-posts',
                        title: 'Social Posts',
                        icon: '📱',
                        section: 'social-posts',
                        description: 'Moderate social content'
                    }
                ]
            },
            analytics: {
                title: 'Analytics & Reports',
                items: [
                    {
                        id: 'reports',
                        title: 'Reports',
                        icon: '📈',
                        section: 'reports',
                        description: 'Generate and view reports'
                    },
                    {
                        id: 'analytics',
                        title: 'Analytics',
                        icon: '📊',
                        section: 'analytics',
                        description: 'Advanced analytics and insights'
                    }
                ]
            },
            system: {
                title: 'System',
                items: [
                    {
                        id: 'settings',
                        title: 'Settings',
                        icon: '⚙️',
                        section: 'settings',
                        description: 'System configuration'
                    }
                ]
            }
        };
        
        // Mobile breakpoint
        this.mobileBreakpoint = 768;
    }

    // 🚀 Initialize navigation system
    init() {
        try {
            console.log('🧭 Initializing Navigation System...');
            
            this.renderNavigation();
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            this.handleResponsiveLayout();
            
            // Set initial navigation state
            this.setActiveSection('dashboard');
            
            console.log('✅ Navigation System initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize navigation:', error);
        }
    }

    // 🎨 Render navigation structure
    renderNavigation() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) {
            console.warn('⚠️ Sidebar element not found');
            return;
        }
        
        // Find existing nav sections or create container
        let navContainer = sidebar.querySelector('.nav-container');
        if (!navContainer) {
            // Create navigation structure
            navContainer = document.createElement('div');
            navContainer.className = 'nav-container';
            
            // Insert after sidebar header
            const sidebarHeader = sidebar.querySelector('.sidebar-header');
            if (sidebarHeader) {
                sidebarHeader.insertAdjacentElement('afterend', navContainer);
            } else {
                sidebar.appendChild(navContainer);
            }
        }
        
        // Render navigation sections
        navContainer.innerHTML = this.generateNavigationHTML();
        
        // Setup mobile overlay if needed
        this.setupMobileOverlay();
    }

    // 🏗️ Generate navigation HTML
    generateNavigationHTML() {
        let html = '';
        
        Object.entries(this.navigationStructure).forEach(([sectionKey, section]) => {
            html += `
                <div class="nav-section" data-section="${sectionKey}">
                    <h3 class="nav-section-title">${section.title}</h3>
                    <div class="nav-items">
                        ${section.items.map(item => this.generateNavItemHTML(item)).join('')}
                    </div>
                </div>
            `;
        });
        
        return html;
    }

    // 🔗 Generate navigation item HTML
    generateNavItemHTML(item) {
        return `
            <a class="nav-item" 
               data-section="${item.section}" 
               data-nav-id="${item.id}"
               href="#${item.section}"
               title="${item.description}">
                <span class="nav-icon">${item.icon}</span>
                <span class="nav-text">${item.title}</span>
                <span class="nav-indicator"></span>
            </a>
        `;
    }

    // 📱 Setup mobile overlay
    setupMobileOverlay() {
        // Remove existing overlay
        const existingOverlay = document.querySelector('.sidebar-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Create new overlay for mobile
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', () => this.closeMobileMenu());
        
        document.body.appendChild(overlay);
    }

    // 🎯 Setup event listeners
    setupEventListeners() {
        // Sidebar toggle button
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        // Navigation item clicks (delegated)
        document.addEventListener('click', (event) => {
            const navItem = event.target.closest('.nav-item');
            if (navItem) {
                event.preventDefault();
                const sectionName = navItem.dataset.section;
                if (sectionName) {
                    this.navigateToSection(sectionName);
                }
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResponsiveLayout();
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', (event) => {
            const hash = window.location.hash.slice(1);
            if (hash) {
                this.setActiveSection(hash, false); // Don't update history
            }
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (event) => {
            const sidebar = document.querySelector('.sidebar');
            const sidebarToggle = document.getElementById('sidebarToggle');
            
            if (this.isMobileMenuOpen && 
                !sidebar?.contains(event.target) && 
                !sidebarToggle?.contains(event.target)) {
                this.closeMobileMenu();
            }
        });
    }

    // ⌨️ Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Don't handle shortcuts when typing in inputs
            if (event.target.matches('input, textarea, select')) {
                return;
            }
            
            // Don't handle when modals are open
            if (document.querySelector('.modal-overlay.show')) {
                return;
            }
            
            switch (event.key) {
                case 'Escape':
                    if (this.isMobileMenuOpen) {
                        event.preventDefault();
                        this.closeMobileMenu();
                    }
                    break;
                    
                case 'ArrowUp':
                    if (event.altKey) {
                        event.preventDefault();
                        this.navigateToPreviousSection();
                    }
                    break;
                    
                case 'ArrowDown':
                    if (event.altKey) {
                        event.preventDefault();
                        this.navigateToNextSection();
                    }
                    break;
                    
                case 'b':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        this.navigateBack();
                    }
                    break;
                    
                case 'm':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        this.toggleMobileMenu();
                    }
                    break;
                    
                default:
                    // Number keys for quick navigation
                    if (/^[1-9]$/.test(event.key) && (event.ctrlKey || event.metaKey)) {
                        event.preventDefault();
                        this.navigateByIndex(parseInt(event.key) - 1);
                    }
                    break;
            }
        });
    }

    // 📱 Handle responsive layout
    handleResponsiveLayout() {
        const isMobile = window.innerWidth <= this.mobileBreakpoint;
        const sidebar = document.querySelector('.sidebar');
        const body = document.body;
        
        if (isMobile) {
            body.classList.add('mobile-layout');
            if (sidebar && !this.isMobileMenuOpen) {
                sidebar.classList.remove('open');
            }
        } else {
            body.classList.remove('mobile-layout');
            if (sidebar) {
                sidebar.classList.remove('open');
            }
            this.isMobileMenuOpen = false;
            this.hideMobileOverlay();
        }
    }

    // 🧭 Navigate to section
    async navigateToSection(sectionName, addToHistory = true) {
        if (this.isAnimating || sectionName === this.currentSection) {
            return;
        }
        
        try {
            this.isAnimating = true;
            
            // Add to navigation history
            if (addToHistory && this.currentSection) {
                this.addToHistory(this.currentSection);
            }
            
            // Close mobile menu if open
            if (this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
            
            // Update active section
            this.setActiveSection(sectionName, addToHistory);
            
            // Load section if section loader is available
            if (window.sectionLoader) {
                await window.sectionLoader.loadSection(sectionName);
            }
            
            // Show navigation feedback
            this.showNavigationFeedback(sectionName);
            
        } catch (error) {
            console.error(`❌ Navigation error for section ${sectionName}:`, error);
            this.showNavigationError(sectionName);
        } finally {
            this.isAnimating = false;
        }
    }

    // ✨ Set active section
    setActiveSection(sectionName, updateHistory = true) {
        // Update current section
        const previousSection = this.currentSection;
        this.currentSection = sectionName;
        
        // Update navigation visual state
        this.updateNavigationState(sectionName);
        
        // Update URL if needed
        if (updateHistory && window.location.hash !== `#${sectionName}`) {
            history.pushState({ section: sectionName }, '', `#${sectionName}`);
        }
        
        // Trigger section change event
        this.triggerSectionChangeEvent(sectionName, previousSection);
    }

    // 🎨 Update navigation visual state
    updateNavigationState(sectionName) {
        // Remove active class from all nav items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current section
        const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
            
            // Scroll into view if needed (mobile)
            if (window.innerWidth <= this.mobileBreakpoint) {
                activeNavItem.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest' 
                });
            }
        }
        
        // Update breadcrumbs
        this.updateBreadcrumbs(sectionName);
    }

    // 🍞 Update breadcrumbs
    updateBreadcrumbs(sectionName) {
        const breadcrumbContainer = document.querySelector('.breadcrumbs');
        if (!breadcrumbContainer) return;
        
        const navItem = this.findNavigationItem(sectionName);
        if (!navItem) return;
        
        const breadcrumbHTML = `
            <div class="breadcrumb-item">
                <span class="breadcrumb-icon">🏠</span>
                <span class="breadcrumb-text">Dashboard</span>
            </div>
            ${sectionName !== 'dashboard' ? `
                <div class="breadcrumb-separator">›</div>
                <div class="breadcrumb-item active">
                    <span class="breadcrumb-icon">${navItem.icon}</span>
                    <span class="breadcrumb-text">${navItem.title}</span>
                </div>
            ` : ''}
        `;
        
        breadcrumbContainer.innerHTML = breadcrumbHTML;
    }

    // 📱 Mobile menu controls
    toggleMobileMenu() {
        if (this.isMobileMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.add('open');
            this.isMobileMenuOpen = true;
            this.showMobileOverlay();
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            
            // Focus first nav item for accessibility
            const firstNavItem = sidebar.querySelector('.nav-item');
            if (firstNavItem) {
                firstNavItem.focus();
            }
        }
    }

    closeMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
            this.isMobileMenuOpen = false;
            this.hideMobileOverlay();
            
            // Restore body scroll
            document.body.style.overflow = '';
        }
    }

    showMobileOverlay() {
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.classList.add('show');
        }
    }

    hideMobileOverlay() {
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    // 📜 Navigation history management
    addToHistory(sectionName) {
        // Remove if already in history
        const index = this.navigationHistory.indexOf(sectionName);
        if (index > -1) {
            this.navigationHistory.splice(index, 1);
        }
        
        // Add to beginning
        this.navigationHistory.unshift(sectionName);
        
        // Limit history length
        if (this.navigationHistory.length > this.maxHistoryLength) {
            this.navigationHistory = this.navigationHistory.slice(0, this.maxHistoryLength);
        }
    }

    navigateBack() {
        if (this.navigationHistory.length > 0) {
            const previousSection = this.navigationHistory.shift();
            this.navigateToSection(previousSection, false);
        }
    }

    // 🔍 Navigation utilities
    findNavigationItem(sectionName) {
        for (const section of Object.values(this.navigationStructure)) {
            const item = section.items.find(item => item.section === sectionName);
            if (item) return item;
        }
        return null;
    }

    getAllNavigationItems() {
        const items = [];
        Object.values(this.navigationStructure).forEach(section => {
            items.push(...section.items);
        });
        return items;
    }

    navigateByIndex(index) {
        const allItems = this.getAllNavigationItems();
        if (index >= 0 && index < allItems.length) {
            this.navigateToSection(allItems[index].section);
        }
    }

    navigateToPreviousSection() {
        const allItems = this.getAllNavigationItems();
        const currentIndex = allItems.findIndex(item => item.section === this.currentSection);
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : allItems.length - 1;
        this.navigateToSection(allItems[previousIndex].section);
    }

    navigateToNextSection() {
        const allItems = this.getAllNavigationItems();
        const currentIndex = allItems.findIndex(item => item.section === this.currentSection);
        const nextIndex = currentIndex < allItems.length - 1 ? currentIndex + 1 : 0;
        this.navigateToSection(allItems[nextIndex].section);
    }

    // 💫 Visual feedback
    showNavigationFeedback(sectionName) {
        const navItem = this.findNavigationItem(sectionName);
        if (!navItem) return;
        
        // Create temporary feedback element
        const feedback = document.createElement('div');
        feedback.className = 'navigation-feedback';
        feedback.innerHTML = `
            <div class="feedback-content">
                <span class="feedback-icon">${navItem.icon}</span>
                <span class="feedback-text">${navItem.title}</span>
            </div>
        `;
        
        document.body.appendChild(feedback);
        
        // Show with animation
        setTimeout(() => feedback.classList.add('show'), 10);
        
        // Remove after delay
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 1500);
    }

    showNavigationError(sectionName) {
        if (window.dancifyAdmin) {
            window.dancifyAdmin.showNotification(`Failed to load ${sectionName}`, 'error');
        }
    }

    // 🎯 Event system
    triggerSectionChangeEvent(newSection, previousSection) {
        const event = new CustomEvent('sectionChange', {
            detail: {
                newSection,
                previousSection,
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(event);
    }

    // 📊 Navigation analytics
    getNavigationStats() {
        return {
            currentSection: this.currentSection,
            historyLength: this.navigationHistory.length,
            isMobileMenuOpen: this.isMobileMenuOpen,
            isMobileLayout: window.innerWidth <= this.mobileBreakpoint,
            totalSections: this.getAllNavigationItems().length
        };
    }

    // 🔍 Search navigation items
    searchNavigationItems(query) {
        const allItems = this.getAllNavigationItems();
        const lowercaseQuery = query.toLowerCase();
        
        return allItems.filter(item => 
            item.title.toLowerCase().includes(lowercaseQuery) ||
            item.description.toLowerCase().includes(lowercaseQuery) ||
            item.section.toLowerCase().includes(lowercaseQuery)
        );
    }

    // 🎨 Theme and appearance
    updateNavigationTheme(theme) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.setAttribute('data-theme', theme);
        }
    }

    // ♿ Accessibility helpers
    setupAccessibility() {
        // Add ARIA labels
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const sectionName = item.dataset.section;
            const navItem = this.findNavigationItem(sectionName);
            if (navItem) {
                item.setAttribute('aria-label', `Navigate to ${navItem.title}: ${navItem.description}`);
                item.setAttribute('role', 'button');
            }
        });
        
        // Add keyboard navigation hints
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.setAttribute('aria-label', 'Main navigation');
        }
    }

    // 🔧 Configuration and customization
    updateNavigationStructure(newStructure) {
        this.navigationStructure = { ...this.navigationStructure, ...newStructure };
        this.renderNavigation();
    }

    addNavigationItem(sectionKey, item) {
        if (this.navigationStructure[sectionKey]) {
            this.navigationStructure[sectionKey].items.push(item);
            this.renderNavigation();
        }
    }

    removeNavigationItem(sectionName) {
        Object.values(this.navigationStructure).forEach(section => {
            section.items = section.items.filter(item => item.section !== sectionName);
        });
        this.renderNavigation();
    }

    // 🧹 Cleanup
    cleanup() {
        // Remove event listeners
        window.removeEventListener('resize', this.handleResponsiveLayout);
        window.removeEventListener('popstate', this.handlePopState);
        
        // Clear navigation state
        this.currentSection = 'dashboard';
        this.navigationHistory = [];
        this.isMobileMenuOpen = false;
        this.isAnimating = false;
        
        // Remove mobile overlay
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        console.log('🧹 Navigation cleanup completed');
    }
}

// 🌐 Export for global use
window.DancifyNavigation = DancifyNavigation;

// Create global instance
window.navigationManager = new DancifyNavigation();

console.log('🧭 Dancify Navigation System loaded');
        