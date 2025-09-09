// Dance Style Management System
// Real API integration without mock data

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

    // Initialize dance style management
    async init() {
        try {
            console.log('Initializing Dance Style Management...');
            
            // Wait for DOM elements to be available
            await this.waitForDOMReady();
            
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
            
            // Use real API call instead of mock data
            if (this.api && typeof this.api.getDanceStyles === 'function') {
                console.log('Loading dance styles via API...');
                
                const response = await this.api.getDanceStyles(filters);
                
                if (response && response.success) {
                    this.danceStyles = response.data || [];
                    console.log(`Loaded ${this.danceStyles.length} dance styles via API`);
                } else {
                    throw new Error(response?.error || 'Failed to load dance styles from API');
                }
            } else if (this.api && typeof this.api.request === 'function') {
                console.log('Loading dance styles via generic API request...');
                
                const response = await this.api.request('GET', '/admin/dance-styles');
                
                if (response && response.success) {
                    this.danceStyles = response.data || [];
                    console.log(`Loaded ${this.danceStyles.length} dance styles via API`);
                } else {
                    throw new Error(response?.error || 'Failed to load dance styles from API');
                }
            } else {
                throw new Error('No API client available');
            }
            
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
                        <div class="no-data-icon">No Dance Styles</div>
                        <div class="no-data-text">No dance styles found</div>
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
        const popularityPercentage = Math.min(style.popularity_score || 0, 100);
        const moveCount = style.stats?.moveCount || 0;
        const submissionCount = style.stats?.submissionCount || 0;
        const averageRating = style.stats?.averageRating || 0;
        
        return `
            <div class="style-card ${isSelected ? 'selected' : ''} ${style.is_featured ? 'featured' : ''}" 
                 data-style-id="${style.id}">
                <div class="style-card-header">
                    <input type="checkbox" class="style-checkbox" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="window.danceStyleManager.toggleStyleSelection('${style.id}')">
                    <div class="style-actions">
                        <button class="action-btn edit-btn" title="Edit Style" 
                                onclick="window.danceStyleManager.editStyle('${style.id}')">
                            Edit
                        </button>
                        <button class="action-btn delete-btn" title="Delete Style" 
                                onclick="window.danceStyleManager.deleteStyle('${style.id}')">
                            Delete
                        </button>
                    </div>
                </div>
                
                <div class="style-content">
                    <div class="style-icon" style="color: ${style.color}; font-size: 3rem;">
                        ${style.icon || 'Dance'}
                    </div>
                    
                    <div class="style-info">
                        <h3 class="style-name">${style.name}</h3>
                        <p class="style-description">${style.description}</p>
                    </div>
                    
                    <div class="style-meta">
                        <div class="difficulty-badge difficulty-${style.difficulty_level}">
                            ${style.difficulty_level}
                        </div>
                        ${style.is_featured ? '<div class="featured-badge">Featured</div>' : ''}
                        <div class="origin-badge">${style.cultural_origin || 'Unknown'}</div>
                    </div>
                    
                    <div class="style-stats">
                        <div class="stat">
                            <span class="stat-icon">Moves</span>
                            <span class="stat-label">Moves</span>
                            <span class="stat-value">${moveCount}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-icon">Submissions</span>
                            <span class="stat-label">Submissions</span>
                            <span class="stat-value">${submissionCount}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-icon">Rating</span>
                            <span class="stat-label">Rating</span>
                            <span class="stat-value">${averageRating.toFixed(1)}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-icon">Popularity</span>
                            <span class="stat-label">Popularity</span>
                            <span class="stat-value">${popularityPercentage}%</span>
                        </div>
                    </div>
                    
                    <div class="music-genres">
                        ${style.music_genres ? 
                            style.music_genres.slice(0, 3).map(genre => 
                                `<span class="genre-tag">${genre}</span>`
                            ).join('') : ''
                        }
                        ${style.music_genres && style.music_genres.length > 3 ? 
                            `<span class="genre-more">+${style.music_genres.length - 3}</span>` : ''
                        }
                    </div>
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

    // Edit dance style
    async editStyle(styleId) {
        const style = this.danceStyles.find(s => s.id === styleId);
        if (!style) {
            this.showErrorMessage('Dance style not found');
            return;
        }
        
        // Show edit modal (implementation needed)
        this.showSuccessMessage(`Edit functionality for "${style.name}" - modal needed`);
    }

    // Delete dance style
    async deleteStyle(styleId) {
        const style = this.danceStyles.find(s => s.id === styleId);
        if (!style) {
            this.showErrorMessage('Dance style not found');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete "${style.name}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            // Call API to delete
            if (this.api && typeof this.api.deleteDanceStyle === 'function') {
                const response = await this.api.deleteDanceStyle(styleId);
                if (response && response.success) {
                    console.log('Dance style deleted via API');
                } else {
                    throw new Error(response?.error || 'Failed to delete dance style');
                }
            } else if (this.api && typeof this.api.request === 'function') {
                const response = await this.api.request('DELETE', `/admin/dance-styles/${styleId}`);
                if (response && response.success) {
                    console.log('Dance style deleted via API');
                } else {
                    throw new Error(response?.error || 'Failed to delete dance style');
                }
            } else {
                throw new Error('No API client available');
            }
            
            // Remove from local array
            this.danceStyles = this.danceStyles.filter(s => s.id !== styleId);
            this.selectedStyles.delete(styleId);
            
            this.showSuccessMessage('Dance style deleted successfully');
            this.renderDanceStyles();
            this.updateStyleStats();
            
        } catch (error) {
            console.error('Error deleting dance style:', error);
            this.showErrorMessage('Failed to delete dance style: ' + error.message);
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

    // Show create style modal
    showCreateStyleModal() {
        // Modal implementation needed
        this.showSuccessMessage('Create dance style modal - implementation needed');
    }

    // Save style form
    async saveStyleForm() {
        const form = document.getElementById('styleForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const styleData = {
            name: formData.get('name'),
            description: formData.get('description'),
            icon: formData.get('icon'),
            color: formData.get('color'),
            difficulty_level: formData.get('difficulty'),
            cultural_origin: formData.get('origin'),
            is_featured: formData.get('featured') === 'on',
            popularity_score: parseInt(formData.get('popularity')) || 0
        };
        
        try {
            // Call API to create
            if (this.api && typeof this.api.createDanceStyle === 'function') {
                const response = await this.api.createDanceStyle(styleData);
                if (response && response.success) {
                    this.danceStyles.push(response.data);
                    console.log('Dance style created via API');
                } else {
                    throw new Error(response?.error || 'Failed to create dance style');
                }
            } else if (this.api && typeof this.api.request === 'function') {
                const response = await this.api.request('POST', '/admin/dance-styles', styleData);
                if (response && response.success) {
                    this.danceStyles.push(response.data);
                    console.log('Dance style created via API');
                } else {
                    throw new Error(response?.error || 'Failed to create dance style');
                }
            } else {
                throw new Error('No API client available');
            }
            
            this.showSuccessMessage('Dance style created successfully');
            const modal = document.getElementById('styleModal');
            if (modal) modal.style.display = 'none';
            this.renderDanceStyles();
            this.updateStyleStats();
            
        } catch (error) {
            console.error('Error creating dance style:', error);
            this.showErrorMessage('Failed to create dance style: ' + error.message);
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
        const messageContainer = document.getElementById('messageContainer') || document.body;
        
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        
        const iconMap = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Info'
        };
        
        messageEl.innerHTML = `
            <span class="message-icon">${iconMap[type] || iconMap.info}</span>
            <span class="message-text">${message}</span>
            <button class="message-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            background-color: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        `;
        
        messageContainer.appendChild(messageEl);
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }
}

// Make the class available globally
window.DanceStyleManager = DanceStyleManager;
console.log('Dance Style Manager loaded');