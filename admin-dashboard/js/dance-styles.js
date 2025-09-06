// 💃 Dancify Admin Dashboard - Dance Style Management
// Real-time dance style management with backend integration

class DanceStyleManager {
    constructor(apiClient) {
        this.api = apiClient;
        this.danceStyles = [];
        this.selectedStyles = new Set();
        
        console.log('🎭 Dance Style Manager initialized');
    }

    // 🚀 Initialize dance style management
    async init() {
        try {
            console.log('🎭 Initializing Dance Style Management...');
            
            // Load initial data
            await this.loadDanceStyles();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up real-time updates
            this.setupRealTimeUpdates();
            
            console.log('✅ Dance Style Management initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Dance Style Management:', error);
            this.showErrorMessage('Failed to initialize dance style management: ' + error.message);
        }
    }

    // 📊 Load dance styles from API
    async loadDanceStyles() {
        try {
            console.log('📊 Loading dance styles...');
            
            this.showLoadingState();
            
            const response = await this.api.getDanceStyles({ include_stats: true });
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load dance styles');
            }
            
            this.danceStyles = response.data || [];
            
            this.renderDanceStyles();
            this.updateStyleStats();
            
            this.hideLoadingState();
            
            console.log(`✅ Loaded ${this.danceStyles.length} dance styles`);
            
        } catch (error) {
            console.error('❌ Failed to load dance styles:', error);
            this.hideLoadingState();
            this.showErrorMessage('Failed to load dance styles: ' + error.message);
        }
    }

    // 🎨 Render dance styles grid
    renderDanceStyles() {
        const stylesContainer = document.getElementById('danceStylesGrid');
        if (!stylesContainer) {
            console.warn('⚠️ Dance styles grid container not found');
            return;
        }
        
        if (this.danceStyles.length === 0) {
            stylesContainer.innerHTML = `
                <div class="no-data">
                    <div class="no-data-content">
                        <div class="no-data-icon">🎭</div>
                        <div class="no-data-text">No dance styles found</div>
                        <div class="no-data-subtitle">Create your first dance style to get started</div>
                        <button class="btn btn-primary" onclick="danceStyleManager.showCreateStyleModal()">
                            ➕ Create Dance Style
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        const styleCards = this.danceStyles.map(style => this.createStyleCard(style)).join('');
        stylesContainer.innerHTML = styleCards;
    }

    // 🎭 Create dance style card
    createStyleCard(style) {
        const isSelected = this.selectedStyles.has(style.id);
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
                           onchange="danceStyleManager.toggleStyleSelection('${style.id}')">
                    <div class="style-actions">
                        <button class="btn btn-sm btn-ghost" onclick="danceStyleManager.viewStyle('${style.id}')" title="View Details">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="danceStyleManager.editStyle('${style.id}')" title="Edit Style">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="danceStyleManager.deleteStyle('${style.id}')" title="Delete Style">
                            🗑️
                        </button>
                    </div>
                    ${style.is_featured ? '<div class="featured-badge">⭐ Featured</div>' : ''}
                </div>
                
                <div class="style-icon" style="background: ${style.color || '#FF6B9D'}">
                    <span class="style-emoji">${style.icon || '💃'}</span>
                </div>
                
                <div class="style-info">
                    <h3 class="style-name">${style.name}</h3>
                    <p class="style-description">${style.description}</p>
                    
                    <div class="style-meta">
                        <div class="difficulty-badge difficulty-${style.difficulty_level}">
                            ${style.difficulty_level || 'beginner'}
                        </div>
                        ${style.cultural_origin ? `<div class="origin-badge">${style.cultural_origin}</div>` : ''}
                    </div>
                    
                    <div class="style-popularity">
                        <div class="popularity-label">Popularity</div>
                        <div class="popularity-bar">
                            <div class="popularity-fill" style="width: ${popularityPercentage}%"></div>
                        </div>
                        <div class="popularity-value">${style.popularity_score || 0}%</div>
                    </div>
                    
                    <div class="style-stats">
                        <div class="stat">
                            <span class="stat-icon">🕺</span>
                            <span class="stat-label">Moves</span>
                            <span class="stat-value">${moveCount}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-icon">📹</span>
                            <span class="stat-label">Submissions</span>
                            <span class="stat-value">${submissionCount}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-icon">⭐</span>
                            <span class="stat-label">Rating</span>
                            <span class="stat-value">${averageRating.toFixed(1)}</span>
                        </div>
                    </div>
                    
                    ${style.music_genres && style.music_genres.length > 0 ? `
                        <div class="music-genres">
                            ${style.music_genres.slice(0, 3).map(genre => 
                                `<span class="genre-tag">${genre}</span>`
                            ).join('')}
                            ${style.music_genres.length > 3 ? `<span class="genre-more">+${style.music_genres.length - 3}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // 📊 Update style statistics
    updateStyleStats() {
        const stats = {
            total: this.danceStyles.length,
            featured: this.danceStyles.filter(s => s.is_featured).length,
            beginner: this.danceStyles.filter(s => s.difficulty_level === 'beginner').length,
            intermediate: this.danceStyles.filter(s => s.difficulty_level === 'intermediate').length,
            advanced: this.danceStyles.filter(s => s.difficulty_level === 'advanced').length
        };
        
        // Update stat cards
        const totalStylesEl = document.getElementById('totalStylesCount');
        const featuredStylesEl = document.getElementById('featuredStylesCount');
        const beginnerStylesEl = document.getElementById('beginnerStylesCount');
        const advancedStylesEl = document.getElementById('advancedStylesCount');
        
        if (totalStylesEl) totalStylesEl.textContent = stats.total.toLocaleString();
        if (featuredStylesEl) featuredStylesEl.textContent = stats.featured.toLocaleString();
        if (beginnerStylesEl) beginnerStylesEl.textContent = stats.beginner.toLocaleString();
        if (advancedStylesEl) advancedStylesEl.textContent = (stats.intermediate + stats.advanced).toLocaleString();
    }

    // 🎯 Set up event listeners
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('styleSearchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.applyFilters();
                }, 500);
            });
        }

        // Filter dropdowns
        const filterElements = ['difficultyFilter', 'featuredFilter'];
        filterElements.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', () => {
                    this.applyFilters();
                });
            }
        });

        // Create style button
        const createBtn = document.getElementById('createStyleBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateStyleModal();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshStylesBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshStyles();
            });
        }
    }

    // 🔄 Set up real-time updates
    setupRealTimeUpdates() {
        // Refresh data every 10 minutes
        setInterval(() => {
            console.log('🔄 Auto-refreshing dance style data...');
            this.loadDanceStyles();
        }, 10 * 60 * 1000);
    }

    // 🔍 Apply filters
    applyFilters() {
        const searchInput = document.getElementById('styleSearchInput');
        const difficultyFilter = document.getElementById('difficultyFilter');
        const featuredFilter = document.getElementById('featuredFilter');

        let filteredStyles = [...this.danceStyles];

        // Apply search filter
        if (searchInput?.value.trim()) {
            const searchTerm = searchInput.value.toLowerCase();
            filteredStyles = filteredStyles.filter(style => 
                style.name.toLowerCase().includes(searchTerm) ||
                style.description.toLowerCase().includes(searchTerm) ||
                (style.cultural_origin && style.cultural_origin.toLowerCase().includes(searchTerm))
            );
        }

        // Apply difficulty filter
        if (difficultyFilter?.value) {
            filteredStyles = filteredStyles.filter(style => 
                style.difficulty_level === difficultyFilter.value
            );
        }

        // Apply featured filter
        if (featuredFilter?.value === 'featured') {
            filteredStyles = filteredStyles.filter(style => style.is_featured);
        } else if (featuredFilter?.value === 'not-featured') {
            filteredStyles = filteredStyles.filter(style => !style.is_featured);
        }

        this.renderFilteredStyles(filteredStyles);
    }

    // 🎨 Render filtered styles
    renderFilteredStyles(styles) {
        const stylesContainer = document.getElementById('danceStylesGrid');
        if (!stylesContainer) return;
        
        if (styles.length === 0) {
            stylesContainer.innerHTML = `
                <div class="no-data">
                    <div class="no-data-content">
                        <div class="no-data-icon">🔍</div>
                        <div class="no-data-text">No styles match your filters</div>
                        <div class="no-data-subtitle">Try adjusting your search criteria</div>
                        <button class="btn btn-secondary" onclick="danceStyleManager.clearFilters()">
                            🧹 Clear Filters
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        const styleCards = styles.map(style => this.createStyleCard(style)).join('');
        stylesContainer.innerHTML = styleCards;
    }

    // 🧹 Clear filters
    clearFilters() {
        document.getElementById('styleSearchInput').value = '';
        document.getElementById('difficultyFilter').value = '';
        document.getElementById('featuredFilter').value = '';
        
        this.renderDanceStyles();
    }

    // 🔄 Refresh styles
    async refreshStyles() {
        console.log('🔄 Refreshing dance style data...');
        await this.loadDanceStyles();
        this.showSuccessMessage('Dance style data refreshed successfully');
    }

    // ✅ Toggle style selection
    toggleStyleSelection(styleId) {
        if (this.selectedStyles.has(styleId)) {
            this.selectedStyles.delete(styleId);
        } else {
            this.selectedStyles.add(styleId);
        }
        
        this.updateBulkActionButtons();
    }

    // 🎯 Update bulk action buttons
    updateBulkActionButtons() {
        const bulkActionContainer = document.getElementById('bulkActionContainer');
        const selectedCount = this.selectedStyles.size;
        
        if (bulkActionContainer) {
            if (selectedCount > 0) {
                bulkActionContainer.style.display = 'block';
                bulkActionContainer.querySelector('.selected-count').textContent = selectedCount;
            } else {
                bulkActionContainer.style.display = 'none';
            }
        }
    }

    // 👁️ View style details
    async viewStyle(styleId) {
        try {
            const response = await this.api.getDanceStyle(styleId);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load dance style');
            }
            
            this.showStyleModal(response.data, 'view');
            
        } catch (error) {
            console.error('❌ Failed to load dance style:', error);
            this.showErrorMessage('Failed to load dance style details: ' + error.message);
        }
    }

    // ✏️ Edit style
    async editStyle(styleId) {
        try {
            const response = await this.api.getDanceStyle(styleId);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load dance style');
            }