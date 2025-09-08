// 💃 Dancify Admin Dashboard - Dance Style Management
// Real-time dance style management with backend integration

class DanceStyleManager {
    constructor(apiClient) {
        this.api = apiClient;
        this.danceStyles = [];
        this.currentPage = 1;
        this.currentFilters = {};
        this.isLoading = false;
        
        console.log('🎭 Dance Style Manager initialized');
    }

    // 🚀 Initialize dance style management
    async init() {
        try {
            console.log('🎭 Initializing Dance Style Management...');
            
            await this.loadDanceStyles();
            this.setupEventListeners();
            this.setupFilters();
            
            console.log('✅ Dance Style Management initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Dance Style Management:', error);
            this.showErrorMessage('Failed to initialize dance style management: ' + error.message);
        }
    }

    // 📊 Load dance styles from API
    async loadDanceStyles(page = 1, filters = {}) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.currentPage = page;
        this.currentFilters = filters;
        
        console.log(`📊 Loading dance styles (page ${page})...`);
        
        try {
            this.showLoadingState();
            
            // Use mock data for now since we're in development
            const mockData = this.getMockDanceStyles();
            
            this.danceStyles = mockData;
            console.log(`✅ Loaded ${this.danceStyles.length} dance styles`);
            
            this.renderDanceStyles();
            this.updateStyleStats();
            
        } catch (error) {
            console.error('❌ Failed to load dance styles:', error);
            this.showErrorMessage('Failed to load dance styles: ' + error.message);
            this.danceStyles = [];
            this.renderDanceStyles();
        } finally {
            this.isLoading = false;
        }
    }

    // 🎯 Generate mock dance styles data
    getMockDanceStyles() {
        return [
            {
                id: 'ballet',
                name: 'Ballet',
                description: 'Classical dance form with graceful movements, precise technique, and artistic expression.',
                icon: '🩰',
                color: '#8A2BE2',
                difficulty_level: 'intermediate',
                cultural_origin: 'France',
                is_featured: true,
                popularity_score: 85,
                stats: { moveCount: 24, submissionCount: 156, averageRating: 4.8 },
                music_genres: ['Classical', 'Neoclassical', 'Contemporary Classical']
            },
            {
                id: 'hip-hop',
                name: 'Hip-Hop',
                description: 'Urban dance style featuring breaking, locking, and popping with street culture roots.',
                icon: '🎤',
                color: '#FF69B4',
                difficulty_level: 'beginner',
                cultural_origin: 'USA',
                is_featured: true,
                popularity_score: 92,
                stats: { moveCount: 38, submissionCount: 284, averageRating: 4.6 },
                music_genres: ['Hip-Hop', 'Rap', 'R&B', 'Funk']
            },
            {
                id: 'salsa',
                name: 'Salsa',
                description: 'Passionate Latin dance with quick footwork and partner interaction.',
                icon: '💃',
                color: '#FF1493',
                difficulty_level: 'intermediate',
                cultural_origin: 'Cuba',
                is_featured: false,
                popularity_score: 78,
                stats: { moveCount: 18, submissionCount: 94, averageRating: 4.7 },
                music_genres: ['Salsa', 'Latin', 'Mambo', 'Cha-cha']
            },
            {
                id: 'contemporary',
                name: 'Contemporary',
                description: 'Modern dance combining ballet technique with expressive, interpretive movement.',
                icon: '🎭',
                color: '#9370DB',
                difficulty_level: 'advanced',
                cultural_origin: 'International',
                is_featured: false,
                popularity_score: 71,
                stats: { moveCount: 22, submissionCount: 67, averageRating: 4.9 },
                music_genres: ['Contemporary', 'Alternative', 'Indie', 'Electronic']
            },
            {
                id: 'jazz',
                name: 'Jazz',
                description: 'Energetic dance style with syncopated rhythms and theatrical expression.',
                icon: '🎺',
                color: '#FFD700',
                difficulty_level: 'intermediate',
                cultural_origin: 'USA',
                is_featured: false,
                popularity_score: 65,
                stats: { moveCount: 19, submissionCount: 73, averageRating: 4.5 },
                music_genres: ['Jazz', 'Musical Theatre', 'Swing', 'Big Band']
            },
            {
                id: 'latin',
                name: 'Latin',
                description: 'Collection of passionate dances from Latin America with rhythmic flair.',
                icon: '🌶️',
                color: '#FF4500',
                difficulty_level: 'intermediate',
                cultural_origin: 'Latin America',
                is_featured: false,
                popularity_score: 69,
                stats: { moveCount: 31, submissionCount: 128, averageRating: 4.6 },
                music_genres: ['Bachata', 'Merengue', 'Reggaeton', 'Tango']
            },
            {
                id: 'breakdance',
                name: 'Breakdance',
                description: 'Athletic street dance with floor work, power moves, and creative expression.',
                icon: '🕺',
                color: '#32CD32',
                difficulty_level: 'advanced',
                cultural_origin: 'USA',
                is_featured: true,
                popularity_score: 88,
                stats: { moveCount: 45, submissionCount: 203, averageRating: 4.7 },
                music_genres: ['Breakbeat', 'Hip-Hop', 'Funk', 'Electronic']
            },
            {
                id: 'ballroom',
                name: 'Ballroom',
                description: 'Elegant partner dances performed in formal settings with refined technique.',
                icon: '💫',
                color: '#800080',
                difficulty_level: 'intermediate',
                cultural_origin: 'Europe',
                is_featured: false,
                popularity_score: 58,
                stats: { moveCount: 26, submissionCount: 89, averageRating: 4.8 },
                music_genres: ['Waltz', 'Foxtrot', 'Tango', 'Quickstep']
            }
        ];
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
                        <button class="btn btn-primary" onclick="window.danceStyleManager.showCreateStyleModal()">
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
                        <button class="btn btn-sm btn-ghost" onclick="window.danceStyleManager.viewStyle('${style.id}')" title="View Details">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="window.danceStyleManager.editStyle('${style.id}')" title="Edit Style">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.danceStyleManager.deleteStyle('${style.id}')" title="Delete Style">
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

    // 🔍 Setup filters
    setupFilters() {
        // Filter setup can be added here if needed
    }

    // 🔍 Apply filters
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
                        <button class="btn btn-secondary" onclick="window.danceStyleManager.clearFilters()">
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
        const searchInput = document.getElementById('styleSearch');
        if (searchInput) searchInput.value = '';
        
        this.renderDanceStyles();
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
                const inputs = form.elements;
                if (inputs.name) inputs.name.value = style.name || '';
                if (inputs.description) inputs.description.value = style.description || '';
                if (inputs.icon) inputs.icon.value = style.icon || '';
                if (inputs.color) inputs.color.value = style.color || '#FF69B4';
                if (inputs.difficulty) inputs.difficulty.value = style.difficulty_level || 'beginner';
                if (inputs.origin) inputs.origin.value = style.cultural_origin || '';
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
        this.showSuccessMessage(`Viewing ${style.name} details`);
    }

    // 🗑️ Delete style
    async deleteStyle(styleId) {
        const style = this.danceStyles.find(s => s.id === styleId);
        if (!style) return;
        
        if (!confirm(`Are you sure you want to delete "${style.name}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            // Remove from local array (in production, this would call the API)
            this.danceStyles = this.danceStyles.filter(s => s.id !== styleId);
            
            this.showSuccessMessage('Dance style deleted successfully');
            this.renderDanceStyles();
            this.updateStyleStats();
            
        } catch (error) {
            console.error('❌ Error deleting dance style:', error);
            this.showErrorMessage('Failed to delete dance style: ' + error.message);
        }
    }

    // 🔀 Toggle style selection
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
        }
    }

    // 💾 Save style form
    async saveStyleForm() {
        const form = document.getElementById('styleForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const styleData = {
            id: Date.now().toString(), // Generate ID
            name: formData.get('name'),
            description: formData.get('description'),
            icon: formData.get('icon'),
            color: formData.get('color'),
            difficulty_level: formData.get('difficulty'),
            cultural_origin: formData.get('origin'),
            is_featured: false,
            popularity_score: Math.floor(Math.random() * 100),
            stats: { moveCount: 0, submissionCount: 0, averageRating: 0 }
        };
        
        try {
            // Add to local array (in production, this would call the API)
            this.danceStyles.push(styleData);
            
            this.showSuccessMessage('Dance style created successfully');
            document.getElementById('styleModal').style.display = 'none';
            this.renderDanceStyles();
            this.updateStyleStats();
            
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

    // ✅ Show success message
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    // ❌ Show error message
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    // 💬 Show message
    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('messageContainer') || document.body;
        
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        
        const iconMap = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        messageEl.innerHTML = `
            <span class="message-icon">${iconMap[type] || iconMap.info}</span>
            <span class="message-text">${message}</span>
            <button class="message-close" onclick="this.parentElement.remove()">✕</button>
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
console.log('🎭 Dance Style Manager loaded');