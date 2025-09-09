// Dance Style Management System
// Simplified version with only essential fields

class DanceStyleManager {
    constructor(apiClient) {
        this.api = apiClient;
        this.danceStyles = [];
        this.currentPage = 1;
        this.currentFilters = {};
        this.isLoading = false;
        this.selectedStyles = new Set();
        
        console.log('Dance Style Manager initialized');
    }

    forceCreateHeader() {
        console.log('Force creating header...');
        
        const section = document.getElementById('dance-style-management');
        if (!section) {
            console.log('No dance-style-management section found');
            return;
        }
        
        // Remove any existing header
        const existingHeader = section.querySelector('.section-header');
        if (existingHeader) {
            existingHeader.remove();
        }
        
        // Create new header
        const header = document.createElement('div');
        header.className = 'section-header';
        header.style.cssText = 'display: flex !important; justify-content: space-between !important; align-items: center !important; padding: 20px 0 !important; margin-bottom: 20px !important; border-bottom: 1px solid #E9ECEF !important;';
        
        header.innerHTML = `
            <div class="header-content" style="flex: 1;">
                <h1 style="font-size: 2.2rem; color: #8A2BE2; margin: 0 0 5px 0; font-weight: 700;">🎭 Dance Style Management</h1>
                <p style="color: #6C757D; margin: 0; font-size: 1rem;">Manage dance styles, categories, and hierarchical organization</p>
            </div>
            <div class="header-actions" style="display: flex !important; gap: 15px;">
                <button class="btn btn-secondary" id="refreshStylesBtn" style="padding: 12px 24px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; border: 1px solid #E9ECEF; background: white; color: #2C3E50; cursor: pointer;">🔄 Refresh</button>
                <button class="btn btn-primary" id="createStyleBtn" style="padding: 12px 24px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; border: none; background: linear-gradient(135deg, #8A2BE2, #FF69B4); color: white; cursor: pointer;">➕ Create Dance Style</button>
            </div>
        `;
        
        // Insert at the beginning of the section
        section.insertBefore(header, section.firstChild);
        
        // Add event listeners
        const refreshBtn = header.querySelector('#refreshStylesBtn');
        const createBtn = header.querySelector('#createStyleBtn');
        
        if (refreshBtn) {
            refreshBtn.onclick = () => this.loadDanceStyles();
        }
        
        if (createBtn) {
            createBtn.onclick = () => this.showCreateStyleModal();
        }
        
        console.log('Header created successfully');
    }

    // Initialize dance style management
    async init() {
        try {
            console.log('Initializing Dance Style Management...');
            
            // Wait for DOM elements to be available
            await this.waitForDOMReady();
            
            // Force create header
            this.forceCreateHeader();
            
            await this.loadDanceStyles();
            this.setupEventListeners();
            this.setupFilters();
            
            console.log('Dance Style Management initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Dance Style Management:', error);
            this.showErrorMessage('Failed to initialize dance style management: ' + error.message);
        }
    }

    // Wait for DOM elements to be ready
    async waitForDOMReady() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkDOM = () => {
                attempts++;
                
                // Check for multiple possible containers
                const stylesContainer = document.getElementById('danceStylesGrid') || 
                                      document.querySelector('.styles-grid') ||
                                      document.querySelector('#dance-style-management .styles-container');
                
                if (stylesContainer) {
                    console.log('DOM ready - dance styles container found after', attempts, 'attempts');
                    
                    // If we found a different container, ensure it has the right ID
                    if (!stylesContainer.id) {
                        stylesContainer.id = 'danceStylesGrid';
                        console.log('Added missing ID to styles container');
                    }
                    
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.error('DOM timeout - no suitable container found after', attempts, 'attempts');
                    
                    // Create the container if it doesn't exist
                    this.createMissingContainer();
                    resolve();
                } else {
                    console.log('Waiting for DOM... attempt', attempts, '- container not found yet');
                    setTimeout(checkDOM, 100);
                }
            };
            
            checkDOM();
        });
    }

    // Method to create missing container
    createMissingContainer() {
        console.log('Creating missing danceStylesGrid container');
        
        const section = document.getElementById('dance-style-management');
        if (section) {
            // Find or create styles container
            let stylesContainer = section.querySelector('.styles-container');
            if (!stylesContainer) {
                stylesContainer = document.createElement('div');
                stylesContainer.className = 'styles-container';
                stylesContainer.style.cssText = `
                    background: var(--bg-secondary);
                    border-radius: var(--radius-large);
                    padding: 25px;
                    min-height: 200px;
                    box-shadow: var(--shadow-light);
                `;
                section.appendChild(stylesContainer);
            }
            
            // Create the grid container
            const gridContainer = document.createElement('div');
            gridContainer.id = 'danceStylesGrid';
            gridContainer.className = 'styles-grid';
            gridContainer.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                gap: 20px;
                margin-bottom: 25px;
            `;
            
            // Add loading placeholder
            gridContainer.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading dance styles...</div>
                </div>
            `;
            
            stylesContainer.appendChild(gridContainer);
            console.log('Created missing danceStylesGrid container');
        } else {
            console.error('Could not find dance-style-management section');
        }
    }

    // Load dance styles from API
    async loadDanceStyles(page = 1, filters = {}) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.currentPage = page;
        this.currentFilters = filters;
        
        console.log(`Loading dance styles (page ${page})...`);
        
        try {
            this.showLoadingState();
            
            // Use direct fetch to the admin API endpoint
            const response = await fetch('/api/admin/dance-styles?includeStats=true');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch dance styles');
            }

            this.danceStyles = result.data || [];
            console.log(`Loaded ${this.danceStyles.length} dance styles`);
            
            this.renderDanceStyles();
            this.updateStyleStats();
            
        } catch (error) {
            console.error('Failed to load dance styles:', error);
            this.showErrorMessage('Failed to load dance styles: ' + error.message);
            this.danceStyles = [];
            this.renderDanceStyles();
        } finally {
            this.isLoading = false;
        }
    }

    // Render dance styles grid
    renderDanceStyles() {
        const stylesContainer = document.getElementById('danceStylesGrid');
        if (!stylesContainer) {
            console.warn('Dance styles grid container not found');
            return;
        }
        
        if (this.danceStyles.length === 0) {
            stylesContainer.innerHTML = `
                <div class="no-data">
                    <div class="no-data-content">
                        <div class="no-data-icon">💃</div>
                        <div class="no-data-text">No Dance Styles Found</div>
                        <div class="no-data-subtitle">Create your first dance style to get started</div>
                        <button class="btn btn-primary" onclick="window.danceStyleManager.showCreateStyleModal()">
                            Create Dance Style
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        const styleCards = this.danceStyles.map(style => this.createStyleCard(style)).join('');
        stylesContainer.innerHTML = styleCards;
    }

    // Create dance style card
    createStyleCard(style) {
        const isSelected = this.selectedStyles && this.selectedStyles.has(style.id);
        const moveCount = style.stats?.moveCount || 0;
        const submissionCount = style.stats?.submissionCount || 0;
        const averageRating = style.stats?.averageRating || 0;
        
        return `
            <div class="style-card ${isSelected ? 'selected' : ''}" data-style-id="${style.id}">
                <div class="style-card-header">
                    <div class="style-icon" style="background-color: ${style.color || '#8A2BE2'}">
                        ${style.icon || '💃'}
                    </div>
                    <div class="style-info">
                        <h3 class="style-name">${style.name}</h3>
                        <p class="style-description">${style.description}</p>
                    </div>
                </div>
                
                <div class="style-meta">
                    <div class="style-stats">
                        <div class="stat">
                            <span class="stat-value">${moveCount}</span>
                            <span class="stat-label">Moves</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${submissionCount}</span>
                            <span class="stat-label">Submissions</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${averageRating.toFixed(1)}</span>
                            <span class="stat-label">Rating</span>
                        </div>
                    </div>
                </div>
                
                <div class="style-actions">
                    <button class="btn btn-sm btn-outline" onclick="window.danceStyleManager.editStyle('${style.id}')">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.danceStyleManager.deleteStyle('${style.id}', '${style.name}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    // Update style statistics
    updateStyleStats() {
        const stats = {
            total: this.danceStyles.length,
            featured: this.danceStyles.filter(s => s.is_featured).length,
            totalMoves: this.danceStyles.reduce((sum, s) => sum + (s.stats?.moveCount || 0), 0)
        };
        
        // Update stat cards
        const totalStylesEl = document.getElementById('totalStyles');
        const totalCategoriesEl = document.getElementById('totalCategories');
        const totalMovesEl = document.getElementById('totalMoves');
        
        if (totalStylesEl) totalStylesEl.textContent = stats.total.toLocaleString();
        if (totalCategoriesEl) totalCategoriesEl.textContent = stats.featured.toLocaleString();
        if (totalMovesEl) totalMovesEl.textContent = stats.totalMoves.toLocaleString();
    }

    // Set up event listeners
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('styleSearch');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.applyFilters();
                }, 500);
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshStylesBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDanceStyles();
            });
        }
    }

    // Setup filters
    setupFilters() {
        // Filter setup can be added here if needed
    }

    // Apply filters
    applyFilters() {
        const searchInput = document.getElementById('styleSearch');
        const searchTerm = searchInput?.value.toLowerCase() || '';
        
        let filteredStyles = this.danceStyles;
        
        if (searchTerm) {
            filteredStyles = filteredStyles.filter(style =>
                style.name.toLowerCase().includes(searchTerm) ||
                style.description.toLowerCase().includes(searchTerm) ||
                (style.cultural_origin && style.cultural_origin.toLowerCase().includes(searchTerm))
            );
        }
        
        this.renderFilteredStyles(filteredStyles);
    }

    // Render filtered styles
    renderFilteredStyles(styles) {
        const stylesContainer = document.getElementById('danceStylesGrid');
        if (!stylesContainer) return;
        
        if (styles.length === 0) {
            stylesContainer.innerHTML = `
                <div class="no-data">
                    <div class="no-data-content">
                        <div class="no-data-icon">No Results</div>
                        <div class="no-data-text">No styles match your filters</div>
                        <div class="no-data-subtitle">Try adjusting your search criteria</div>
                        <button class="btn btn-secondary" onclick="window.danceStyleManager.clearFilters()">
                            Clear Filters
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        const styleCards = styles.map(style => this.createStyleCard(style)).join('');
        stylesContainer.innerHTML = styleCards;
    }

    // Clear filters
    clearFilters() {
        const searchInput = document.getElementById('styleSearch');
        if (searchInput) searchInput.value = '';
        
        this.renderDanceStyles();
    }

    // Show create style modal
    showCreateStyleModal() {
        this.showStyleModal(null, true);
    }

    // Edit dance style
    async editStyle(styleId) {
        const style = this.danceStyles.find(s => s.id === styleId);
        if (!style) {
            this.showErrorMessage('Dance style not found');
            return;
        }
        
        this.showStyleModal(style, false);
    }

    // Show style modal (create or edit) - SIMPLIFIED VERSION
    showStyleModal(style, isCreateMode) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay show';
        modalOverlay.innerHTML = this.createStyleModalHTML(style, isCreateMode);
        
        document.body.appendChild(modalOverlay);
        
        // Focus first input after modal appears
        setTimeout(() => {
            const firstInput = modalOverlay.querySelector('input, textarea, select');
            if (firstInput) firstInput.focus();
        }, 100);
        
        this.setupStyleModalEvents(modalOverlay, style, isCreateMode);
    }

    // Create style modal HTML - SIMPLIFIED TO ONLY 4 ESSENTIAL FIELDS
    createStyleModalHTML(style, isCreateMode) {
        const icons = ['🩰', '🎤', '🤸', '💃', '🌶️', '🎭', '🎺', '💑', '🕺', '💫', '🎪', '🌟'];
        const colors = ['#FFB6C1', '#FF6B35', '#32CD32', '#FF1493', '#FF4500', '#9370DB', '#FFD700', '#DDA0DD', '#FF69B4', '#00CED1', '#FF8C00', '#DA70D6'];
        
        return `
            <div class="modal">
                <div class="modal-header">
                    <h2>${isCreateMode ? 'Create New Dance Style' : 'Edit Dance Style'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <form class="style-form" id="styleForm">
                        <div class="form-group">
                            <label for="styleName">Style Name *</label>
                            <input type="text" id="styleName" name="name" required 
                                   value="${style?.name || ''}" placeholder="e.g., House, Hip-Hop, Ballet">
                        </div>
                        
                        <div class="form-group">
                            <label for="styleDescription">Description *</label>
                            <textarea id="styleDescription" name="description" required rows="4"
                                      placeholder="Describe the dance style, its characteristics, and what makes it unique...">${style?.description || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="styleIcon">Icon *</label>
                            <input type="hidden" id="styleIcon" name="icon" value="${style?.icon || icons[0]}" required>
                            <div class="icon-selector">
                                ${icons.map(icon => `
                                    <div class="icon-option ${style?.icon === icon ? 'selected' : ''}" 
                                         data-icon="${icon}" onclick="this.parentNode.parentNode.querySelector('#styleIcon').value='${icon}'; this.parentNode.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected')); this.classList.add('selected');">
                                        ${icon}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="styleColor">Color *</label>
                            <input type="hidden" id="styleColor" name="color" value="${style?.color || colors[0]}" required>
                            <div class="color-selector">
                                ${colors.map(color => `
                                    <div class="color-option ${style?.color === color ? 'selected' : ''}" 
                                         data-color="${color}" 
                                         style="background-color: ${color};"
                                         onclick="this.parentNode.parentNode.querySelector('#styleColor').value='${color}'; this.parentNode.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected')); this.classList.add('selected');">
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancel
                    </button>
                    <button type="button" class="btn btn-primary" onclick="window.danceStyleManager.saveStyleForm('${isCreateMode ? 'create' : 'edit'}', '${style?.id || ''}')">
                        ${isCreateMode ? 'Create Style' : 'Save Changes'}
                    </button>
                </div>
            </div>
        `;
    }

    // Setup style modal events
    setupStyleModalEvents(modal, style, isCreateMode) {
        const form = modal.querySelector('#styleForm');
        
        // Handle form submission
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveStyleForm(isCreateMode ? 'create' : 'edit', style?.id || '');
            });
        }
        
        // Close modal on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (confirm('Close without saving? Any changes will be lost.')) {
                    modal.remove();
                }
            }
        });
        
        // Close modal on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape' && modal.parentNode) {
                if (confirm('Close without saving? Any changes will be lost.')) {
                    modal.remove();
                    document.removeEventListener('keydown', handleEscape);
                }
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    // Save style form - SIMPLIFIED
    async saveStyleForm(mode, styleId) {
        try {
            const form = document.getElementById('styleForm');
            if (!form) throw new Error('Form not found');
            
            const formData = new FormData(form);
            
            const styleData = {
                name: formData.get('name'),
                description: formData.get('description'),
                icon: formData.get('icon'),
                color: formData.get('color')
            };
            
            // Validate required fields
            if (!styleData.name || !styleData.description || !styleData.icon || !styleData.color) {
                throw new Error('All fields are required');
            }
            
            let response;
            
            if (mode === 'create') {
                response = await fetch('/api/admin/dance-styles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(styleData)
                });
            } else {
                response = await fetch(`/api/admin/dance-styles/${styleId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(styleData)
                });
            }
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || `Failed to ${mode} dance style`);
            }
            
            this.showSuccessMessage(`Dance style ${mode === 'create' ? 'created' : 'updated'} successfully!`);
            
            // Close modal and refresh
            const modal = document.querySelector('.modal-overlay');
            if (modal) modal.remove();
            
            await this.loadDanceStyles();
            
        } catch (error) {
            console.error(`Error ${mode}ing dance style:`, error);
            this.showErrorMessage(error.message);
        }
    }

    // Delete dance style
    async deleteStyle(styleId, styleName) {
        if (!confirm(`Are you sure you want to delete "${styleName}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/admin/dance-styles/${styleId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete dance style');
            }
            
            this.showSuccessMessage(`Dance style "${styleName}" deleted successfully!`);
            await this.loadDanceStyles();
            
        } catch (error) {
            console.error('Error deleting dance style:', error);
            this.showErrorMessage(error.message);
        }
    }

    // Toggle style selection
    toggleStyleSelection(styleId) {
        if (!this.selectedStyles) {
            this.selectedStyles = new Set();
        }
        
        if (this.selectedStyles.has(styleId)) {
            this.selectedStyles.delete(styleId);
        } else {
            this.selectedStyles.add(styleId);
        }
        
        // Update UI
        const card = document.querySelector(`[data-style-id="${styleId}"]`);
        if (card) {
            card.classList.toggle('selected', this.selectedStyles.has(styleId));
            const checkbox = card.querySelector('.style-checkbox');
            if (checkbox) {
                checkbox.checked = this.selectedStyles.has(styleId);
            }
        }
    }

    // Show loading state
    showLoadingState() {
        const container = document.getElementById('danceStylesGrid');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading dance styles...</div>
                </div>
            `;
        }
    }

    // Show success message
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    // Show error message
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    // Show message
    showMessage(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        // Simple alert for now - you can implement toast notifications later
        alert(message);
    }
}

// Make the class available globally
window.DanceStyleManager = DanceStyleManager;
console.log('Dance Style Manager loaded');