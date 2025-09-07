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
        const totalStylesEl = document.getElementById('totalStyles');
        const totalCategoriesEl = document.getElementById('totalCategories');
        const totalMovesEl = document.getElementById('totalMoves');
        
        if (totalStylesEl) totalStylesEl.textContent = stats.total.toLocaleString();
        if (totalCategoriesEl) totalCategoriesEl.textContent = '0'; // Placeholder
        if (totalMovesEl) totalMovesEl.textContent = '0'; // Placeholder
    }

    // 🎯 Set up event listeners
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
    }

    // 🔍 Apply filters
    applyFilters() {
        const searchInput = document.getElementById('styleSearch');
        const searchTerm = searchInput?.value.toLowerCase() || '';
        
        let filteredStyles = this.danceStyles;
        
        // Apply search filter
        if (searchTerm) {
            filteredStyles = filteredStyles.filter(style =>
                style.name.toLowerCase().includes(searchTerm) ||
                style.description.toLowerCase().includes(searchTerm) ||
                (style.cultural_origin && style.cultural_origin.toLowerCase().includes(searchTerm))
            );
        }
        
        this.renderFilteredStyles(filteredStyles);
    }

    // 🧹 Clear filters
    clearFilters() {
        const searchInput = document.getElementById('styleSearch');
        if (searchInput) searchInput.value = '';
        
        this.renderDanceStyles();
    }

    // 🔄 Set up real-time updates
    setupRealTimeUpdates() {
        // Auto-refresh every 5 minutes
        setInterval(() => {
            this.loadDanceStyles();
        }, 300000);
    }

    // ➕ Show create style modal
    showCreateStyleModal() {
        const modal = document.getElementById('styleModal');
        if (modal) {
            const form = modal.querySelector('#styleForm');
            if (form) form.reset();
            
            const title = modal.querySelector('.modal-title');
            if (title) title.textContent = '✨ Create Dance Style';
            
            modal.style.display = 'flex';
        }
    }

    // ✏️ Edit style
    editStyle(styleId) {
        const style = this.danceStyles.find(s => s.id === styleId);
        if (!style) return;
        
        const modal = document.getElementById('styleModal');
        if (modal) {
            const form = modal.querySelector('#styleForm');
            if (form) {
                form.name.value = style.name || '';
                form.description.value = style.description || '';
                form.icon.value = style.icon || '';
                form.color.value = style.color || '#FF69B4';
                form.difficulty.value = style.difficulty_level || 'beginner';
                form.origin.value = style.cultural_origin || '';
            }
            
            const title = modal.querySelector('.modal-title');
            if (title) title.textContent = '✏️ Edit Dance Style';
            
            modal.style.display = 'flex';
        }
    }

    // 👁️ View style details
    viewStyle(styleId) {
        const style = this.danceStyles.find(s => s.id === styleId);
        if (!style) return;
        
        console.log('Viewing style:', style);
        // Implement style detail view
    }

    // 🗑️ Delete style
    async deleteStyle(styleId) {
        if (!confirm('Are you sure you want to delete this dance style? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await this.api.deleteDanceStyle(styleId);
            
            if (response.success) {
                this.showSuccessMessage('Dance style deleted successfully');
                await this.loadDanceStyles(); // Reload data
            } else {
                throw new Error(response.error || 'Failed to delete dance style');
            }
        } catch (error) {
            console.error('❌ Error deleting dance style:', error);
            this.showErrorMessage('Failed to delete dance style: ' + error.message);
        }
    }

    // 🔀 Toggle style selection
    toggleStyleSelection(styleId) {
        if (this.selectedStyles.has(styleId)) {
            this.selectedStyles.delete(styleId);
        } else {
            this.selectedStyles.add(styleId);
        }
        
        // Update UI
        const card = document.querySelector(`[data-style-id="${styleId}"]`);
        if (card) {
            card.classList.toggle('selected', this.selectedStyles.has(styleId));
        }
    }

    // 💾 Save style form
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
            cultural_origin: formData.get('origin')
        };
        
        try {
            const response = await this.api.createDanceStyle(styleData);
            
            if (response.success) {
                this.showSuccessMessage('Dance style created successfully');
                document.getElementById('styleModal').style.display = 'none';
                await this.loadDanceStyles(); // Reload data
            } else {
                throw new Error(response.error || 'Failed to create dance style');
            }
        } catch (error) {
            console.error('❌ Error creating dance style:', error);
            this.showErrorMessage('Failed to create dance style: ' + error.message);
        }
    }

    // 🎨 Show loading state
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

    // 🎨 Hide loading state
    hideLoadingState() {
        // Loading state will be replaced by actual content
    }

    // ✅ Show success message
    showSuccessMessage(message) {
        console.log('✅ Success:', message);
        // Implement success notification
    }

    // ❌ Show error message
    showErrorMessage(message) {
        console.error('❌ Error:', message);
        // Implement error notification
    }
}

// Make the class available globally
window.DanceStyleManager = DanceStyleManager;
console.log('🎭 Dance Style Manager loaded');