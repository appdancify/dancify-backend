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
                        <div class="origin-badge">${style.cultural_origin || style.origin || 'Unknown'}</div>
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

    // Show style modal (create or edit)
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

    // Create style modal HTML
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
                        <div class="form-row">
                            <div class="form-group">
                                <label for="styleName">Style Name *</label>
                                <input type="text" id="styleName" name="name" required 
                                       value="${style?.name || ''}" placeholder="e.g., Hip-Hop">
                            </div>
                            <div class="form-group">
                                <label for="styleOrigin">Cultural Origin</label>
                                <input type="text" id="styleOrigin" name="origin" 
                                       value="${style?.origin || style?.cultural_origin || ''}" 
                                       placeholder="e.g., United States">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="styleDescription">Description *</label>
                            <textarea id="styleDescription" name="description" required rows="4"
                                      placeholder="Describe the dance style, its characteristics, and what makes it unique...">${style?.description || ''}</textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="styleDifficulty">Difficulty Level</label>
                                <select id="styleDifficulty" name="difficulty_level">
                                    <option value="beginner" ${style?.difficulty_level === 'beginner' ? 'selected' : ''}>Beginner</option>
                                    <option value="intermediate" ${style?.difficulty_level === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                                    <option value="advanced" ${style?.difficulty_level === 'advanced' ? 'selected' : ''}>Advanced</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="styleDisplayOrder">Display Order</label>
                                <input type="number" id="styleDisplayOrder" name="display_order" min="0" max="100"
                                       value="${style?.display_order || 0}" placeholder="0">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Icon</label>
                                <div class="icon-selector">
                                    ${icons.map(icon => `
                                        <button type="button" class="icon-option ${style?.icon === icon ? 'selected' : ''}" 
                                                data-icon="${icon}">${icon}</button>
                                    `).join('')}
                                </div>
                                <input type="hidden" id="styleIcon" name="icon" value="${style?.icon || '💃'}">
                            </div>
                            <div class="form-group">
                                <label>Color</label>
                                <div class="color-selector">
                                    ${colors.map(color => `
                                        <button type="button" class="color-option ${style?.color === color ? 'selected' : ''}" 
                                                data-color="${color}" style="background-color: ${color}"></button>
                                    `).join('')}
                                </div>
                                <input type="hidden" id="styleColor" name="color" value="${style?.color || '#8A2BE2'}">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="styleEstimatedDuration">Estimated Duration (minutes)</label>
                                <input type="number" id="styleEstimatedDuration" name="estimated_duration" min="5" max="180"
                                       value="${style?.estimated_duration || 30}" placeholder="30">
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="styleIsFeatured" name="is_featured" 
                                           ${style?.is_featured ? 'checked' : ''}>
                                    Featured Style
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="styleEquipment">Equipment Needed (comma-separated)</label>
                            <input type="text" id="styleEquipment" name="equipment_needed" 
                                   value="${style?.equipment_needed?.join(', ') || ''}" 
                                   placeholder="e.g., None, Comfortable shoes, Dance mat">
                        </div>
                        
                        <div class="form-group">
                            <label for="styleMusicGenres">Music Genres (comma-separated)</label>
                            <input type="text" id="styleMusicGenres" name="music_genres" 
                                   value="${style?.music_genres?.join(', ') || ''}" 
                                   placeholder="e.g., Hip-Hop, R&B, Pop">
                        </div>
                        
                        <div class="form-group">
                            <label for="styleKeyCharacteristics">Key Characteristics (comma-separated)</label>
                            <input type="text" id="styleKeyCharacteristics" name="key_characteristics" 
                                   value="${style?.key_characteristics?.join(', ') || ''}" 
                                   placeholder="e.g., Sharp movements, Rhythmic, High energy">
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
        
        // Icon selector
        const iconOptions = modal.querySelectorAll('.icon-option');
        const iconInput = modal.querySelector('#styleIcon');
        
        iconOptions.forEach(option => {
            option.addEventListener('click', () => {
                iconOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                iconInput.value = option.dataset.icon;
            });
        });
        
        // Color selector
        const colorOptions = modal.querySelectorAll('.color-option');
        const colorInput = modal.querySelector('#styleColor');
        
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                colorInput.value = option.dataset.color;
            });
        });
        
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

    // Save style form
    async saveStyleForm(mode, styleId) {
        try {
            const form = document.getElementById('styleForm');
            if (!form) throw new Error('Form not found');
            
            const formData = new FormData(form);
            
            // Process equipment, music genres, and characteristics arrays
            const equipmentNeeded = formData.get('equipment_needed') 
                ? formData.get('equipment_needed').split(',').map(item => item.trim()).filter(item => item)
                : [];
                
            const musicGenres = formData.get('music_genres')
                ? formData.get('music_genres').split(',').map(item => item.trim()).filter(item => item)
                : [];
                
            const keyCharacteristics = formData.get('key_characteristics')
                ? formData.get('key_characteristics').split(',').map(item => item.trim()).filter(item => item)
                : [];
            
            const styleData = {
                name: formData.get('name'),
                description: formData.get('description'),
                icon: formData.get('icon'),
                color: formData.get('color'),
                origin: formData.get('origin'),
                cultural_origin: formData.get('origin'), // Map to both fields
                difficulty_level: formData.get('difficulty_level'),
                display_order: parseInt(formData.get('display_order')) || 0,
                is_featured: formData.get('is_featured') === 'on',
                estimated_duration: parseInt(formData.get('estimated_duration')) || 30,
                equipment_needed: equipmentNeeded,
                music_genres: musicGenres,
                key_characteristics: keyCharacteristics
            };
            
            // Validate required fields
            if (!styleData.name || !styleData.description) {
                throw new Error('Name and description are required');
            }
            
            let response;
            
            if (mode === 'create') {
                // Create new style
                if (this.api && typeof this.api.createDanceStyle === 'function') {
                    response = await this.api.createDanceStyle(styleData);
                } else if (this.api && typeof this.api.request === 'function') {
                    response = await this.api.request('POST', '/admin/dance-styles', styleData);
                } else {
                    throw new Error('No API client available');
                }
                
                if (response && response.success) {
                    this.danceStyles.push(response.data);
                    this.showSuccessMessage('Dance style created successfully');
                    console.log('Dance style created:', response.data);
                } else {
                    throw new Error(response?.error || 'Failed to create dance style');
                }
            } else {
                // Update existing style
                if (this.api && typeof this.api.updateDanceStyle === 'function') {
                    response = await this.api.updateDanceStyle(styleId, styleData);
                } else if (this.api && typeof this.api.request === 'function') {
                    response = await this.api.request('PUT', `/admin/dance-styles/${styleId}`, styleData);
                } else {
                    throw new Error('No API client available');
                }
                
                if (response && response.success) {
                    // Update local data
                    const index = this.danceStyles.findIndex(s => s.id === styleId);
                    if (index !== -1) {
                        this.danceStyles[index] = { ...this.danceStyles[index], ...response.data };
                    }
                    this.showSuccessMessage('Dance style updated successfully');
                    console.log('Dance style updated:', response.data);
                } else {
                    throw new Error(response?.error || 'Failed to update dance style');
                }
            }
            
            // Close modal and refresh
            const modal = document.querySelector('.modal-overlay');
            if (modal) modal.remove();
            
            this.renderDanceStyles();
            this.updateStyleStats();
            
        } catch (error) {
            console.error('Error saving dance style:', error);
            this.showErrorMessage('Failed to save dance style: ' + error.message);
        }
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