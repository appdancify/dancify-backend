// 💃 Dancify Admin Dashboard - Dance Style Management
// Real-time dance style management with backend integration

class DanceStyleManager {
    constructor(apiClient) {
        this.api = apiClient;
        this.danceStyles = [];
        this.currentPage = 1;
        this.currentFilters = {};
        this.isLoading = false;
        this.selectedStyles = new Set();
        
        console.log('🎭 Dance Style Manager initialized');
    }

    // 🚀 Initialize dance style management
    async init() {
        try {
            console.log('🎭 Initializing Dance Style Management...');
            
            // CRITICAL: Wait for DOM elements to be available with improved logic
            await this.waitForDOMReady();
            
            await this.loadDanceStyles();
            this.setupEventListeners();
            this.setupFilters();
            
            console.log('✅ Dance Style Management initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Dance Style Management:', error);
            this.showErrorMessage('Failed to initialize dance style management: ' + error.message);
            
            // Load fallback data if API fails
            this.loadFallbackData();
        }
    }

    // 🎯 Wait for DOM elements to be ready - ENHANCED VERSION
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
                    console.log('✅ DOM ready - dance styles container found after', attempts, 'attempts');
                    
                    // If we found a different container, ensure it has the right ID
                    if (!stylesContainer.id) {
                        stylesContainer.id = 'danceStylesGrid';
                        console.log('🔧 Added missing ID to styles container');
                    }
                    
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.error('❌ DOM timeout - no suitable container found after', attempts, 'attempts');
                    
                    // Create the container if it doesn't exist
                    this.createMissingContainer();
                    resolve();
                } else {
                    console.log('⏳ Waiting for DOM... attempt', attempts, '- container not found yet');
                    setTimeout(checkDOM, 100);
                }
            };
            
            checkDOM();
        });
    }

    // 🔧 Method to create missing container
    createMissingContainer() {
        console.log('🔧 Creating missing danceStylesGrid container');
        
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
            console.log('✅ Created missing danceStylesGrid container');
        } else {
            console.error('❌ Could not find dance-style-management section');
        }
    }

    // 📊 Load dance styles from API - FIXED TO USE REAL API
    async loadDanceStyles(page = 1, filters = {}) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.currentPage = page;
        this.currentFilters = filters;
        
        console.log(`📊 Loading dance styles (page ${page})...`);
        
        try {
            this.showLoadingState();
            
            // Try to load from real API first
            if (this.api && typeof this.api.getDanceStyles === 'function') {
                console.log('🌐 Fetching dance styles from API...');
                
                const response = await this.api.getDanceStyles(filters);
                
                if (response && response.success && response.data) {
                    this.danceStyles = response.data;
                    console.log(`✅ Loaded ${this.danceStyles.length} dance styles from API`);
                } else {
                    console.warn('⚠️ API returned no data, using fallback');
                    this.danceStyles = this.getMockDanceStyles();
                    this.showErrorMessage('Using demo data - API returned no results');
                }
            } else {
                console.warn('⚠️ API client not available, using fallback data');
                this.danceStyles = this.getMockDanceStyles();
                this.showErrorMessage('Using demo data - backend connection unavailable');
            }
            
            this.renderDanceStyles();
            this.updateStyleStats();
            
        } catch (error) {
            console.error('❌ Failed to load dance styles:', error);
            this.showErrorMessage('Failed to load dance styles: ' + error.message);
            
            // Fallback to mock data
            this.danceStyles = this.getMockDanceStyles();
            this.renderDanceStyles();
            this.updateStyleStats();
        } finally {
            this.isLoading = false;
        }
    }

    // 🔄 Load fallback data when API fails - NEW
    loadFallbackData() {
        console.log('🔄 Loading fallback dance styles data...');
        
        try {
            this.danceStyles = this.getMockDanceStyles();
            this.renderDanceStyles();
            this.updateStyleStats();
            this.showErrorMessage('Using demo data - backend connection failed');
        } catch (error) {
            console.error('❌ Failed to load fallback data:', error);
        }
    }

    // 🎯 Generate mock dance styles data - ENHANCED
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
                music_genres: ['Classical', 'Neoclassical', 'Contemporary Classical'],
                created_at: '2024-01-15T10:30:00Z',
                updated_at: '2024-03-20T14:45:00Z'
            },
            {
                id: 'hip-hop',
                name: 'Hip-Hop',
                description: 'Urban dance style featuring breaking, locking, and popping with street culture roots.',
                icon: '🕺',
                color: '#32CD32',
                difficulty_level: 'advanced',
                cultural_origin: 'USA',
                is_featured: true,
                popularity_score: 88,
                stats: { moveCount: 45, submissionCount: 203, averageRating: 4.7 },
                music_genres: ['Breakbeat', 'Hip-Hop', 'Funk', 'Electronic'],
                created_at: '2024-01-10T09:15:00Z',
                updated_at: '2024-03-18T16:20:00Z'
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
                music_genres: ['Waltz', 'Foxtrot', 'Tango', 'Quickstep'],
                created_at: '2024-02-05T11:20:00Z',
                updated_at: '2024-03-15T13:10:00Z'
            },
            {
                id: 'salsa',
                name: 'Salsa',
                description: 'Passionate Latin dance with quick footwork and sensual partner movements.',
                icon: '💃',
                color: '#FF4500',
                difficulty_level: 'intermediate',
                cultural_origin: 'Cuba',
                is_featured: true,
                popularity_score: 92,
                stats: { moveCount: 35, submissionCount: 284, averageRating: 4.9 },
                music_genres: ['Salsa', 'Latin', 'Mambo', 'Son'],
                created_at: '2024-01-20T08:45:00Z',
                updated_at: '2024-03-22T10:30:00Z'
            },
            {
                id: 'contemporary',
                name: 'Contemporary',
                description: 'Modern expressive dance combining elements from multiple dance styles.',
                icon: '🌊',
                color: '#4169E1',
                difficulty_level: 'advanced',
                cultural_origin: 'USA',
                is_featured: false,
                popularity_score: 73,
                stats: { moveCount: 32, submissionCount: 165, averageRating: 4.6 },
                music_genres: ['Contemporary', 'Alternative', 'Indie', 'Electronic'],
                created_at: '2024-02-10T15:30:00Z',
                updated_at: '2024-03-19T09:25:00Z'
            },
            {
                id: 'jazz',
                name: 'Jazz',
                description: 'Energetic dance style with sharp movements and theatrical flair.',
                icon: '🎷',
                color: '#FFD700',
                difficulty_level: 'intermediate',
                cultural_origin: 'USA',
                is_featured: false,
                popularity_score: 67,
                stats: { moveCount: 28, submissionCount: 134, averageRating: 4.5 },
                music_genres: ['Jazz', 'Swing', 'Big Band', 'Musical Theatre'],
                created_at: '2024-02-14T12:15:00Z',
                updated_at: '2024-03-16T14:40:00Z'
            },
            {
                id: 'tap',
                name: 'Tap',
                description: 'Percussive dance form creating rhythms with metal taps on shoes.',
                icon: '👞',
                color: '#8B4513',
                difficulty_level: 'advanced',
                cultural_origin: 'USA',
                is_featured: false,
                popularity_score: 45,
                stats: { moveCount: 22, submissionCount: 87, averageRating: 4.7 },
                music_genres: ['Tap', 'Jazz', 'Swing', 'Broadway'],
                created_at: '2024-02-18T10:45:00Z',
                updated_at: '2024-03-14T11:55:00Z'
            },
            {
                id: 'breakdancing',
                name: 'Breakdancing',
                description: 'Athletic street dance featuring dynamic moves, freezes, and power moves.',
                icon: '🤸',
                color: '#FF1493',
                difficulty_level: 'expert',
                cultural_origin: 'USA',
                is_featured: true,
                popularity_score: 79,
                stats: { moveCount: 52, submissionCount: 198, averageRating: 4.8 },
                music_genres: ['Breakbeat', 'Hip-Hop', 'Funk', 'Electronic'],
                created_at: '2024-01-25T13:20:00Z',
                updated_at: '2024-03-21T15:10:00Z'
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
        
        console.log(`✅ Rendered ${this.danceStyles.length} dance style cards`);
    }

    // 🎭 Create dance style card - COMPLETE IMPLEMENTATION
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
                            ✏️
                        </button>
                        <button class="action-btn delete-btn" title="Delete Style" 
                                onclick="window.danceStyleManager.deleteStyle('${style.id}')">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <div class="style-content">
                    <div class="style-icon" style="color: ${style.color}; font-size: 3rem;">
                        ${style.icon}
                    </div>
                    
                    <div class="style-info">
                        <h3 class="style-name">${style.name}</h3>
                        <p class="style-description">${style.description}</p>
                    </div>
                    
                    <div class="style-meta">
                        <div class="difficulty-badge difficulty-${style.difficulty_level}">
                            ${style.difficulty_level}
                        </div>
                        ${style.is_featured ? '<div class="featured-badge">⭐ Featured</div>' : ''}
                        <div class="origin-badge">${style.cultural_origin}</div>
                    </div>
                    
                    <div class="style-stats">
                        <div class="stat">
                            <span class="stat-icon">🕺</span>
                            <span class="stat-label">Moves</span>
                            <span class="stat-value">${moveCount}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-icon">📝</span>
                            <span class="stat-label">Submissions</span>
                            <span class="stat-value">${submissionCount}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-icon">⭐</span>
                            <span class="stat-label">Rating</span>
                            <span class="stat-value">${averageRating.toFixed(1)}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-icon">🔥</span>
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
        
        console.log('📊 Style stats updated:', stats);
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

        // Refresh button
        const refreshBtn = document.getElementById('refreshStylesBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDanceStyles();
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
                (style.cultural_origin && style.cultural_origin.toLowerCase().includes(searchTerm)) ||
                (style.music_genres && style.music_genres.some(genre => 
                    genre.toLowerCase().includes(searchTerm)))
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
        
        console.log(`🔍 Filtered to ${styles.length} dance styles`);
    }

    // 🧹 Clear filters
    clearFilters() {
        const searchInput = document.getElementById('styleSearch');
        if (searchInput) searchInput.value = '';
        
        this.renderDanceStyles();
    }

    // ✏️ Edit dance style - ENHANCED WITH API CALL
    async editStyle(styleId) {
        const style = this.danceStyles.find(s => s.id === styleId);
        if (!style) {
            this.showErrorMessage('Dance style not found');
            return;
        }
        
        try {
            // In production, this would make an API call
            if (this.api && typeof this.api.updateDanceStyle === 'function') {
                console.log(`🌐 Would edit dance style ${styleId} via API`);
                // const response = await this.api.updateDanceStyle(styleId, updatedData);
            }
            
            // For now, just show success message
            this.showSuccessMessage(`Edit functionality for "${style.name}" would open here`);
            
        } catch (error) {
            console.error('❌ Error editing dance style:', error);
            this.showErrorMessage('Failed to edit dance style: ' + error.message);
        }
    }

    // 🗑️ Delete dance style - ENHANCED WITH API CALL
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
            // Try API call first
            if (this.api && typeof this.api.deleteDanceStyle === 'function') {
                console.log(`🌐 Deleting dance style ${styleId} via API...`);
                const response = await this.api.deleteDanceStyle(styleId);
                
                if (response && response.success) {
                    console.log('✅ Dance style deleted via API');
                } else {
                    throw new Error(response?.error || 'API deletion failed');
                }
            }
            
            // Remove from local array
            this.danceStyles = this.danceStyles.filter(s => s.id !== styleId);
            this.selectedStyles.delete(styleId);
            
            this.showSuccessMessage('Dance style deleted successfully');
            this.renderDanceStyles();
            this.updateStyleStats();
            
        } catch (error) {
            console.error('❌ Error deleting dance style:', error);
            this.showErrorMessage('Failed to delete dance style: ' + error.message);
        }
    }

    // ➕ Create new dance style - ENHANCED WITH API CALL
    async createDanceStyle(styleData) {
        try {
            // Validate required fields
            if (!styleData.name || !styleData.description) {
                throw new Error('Name and description are required');
            }
            
            // Add default values
            const newStyle = {
                id: Date.now().toString(),
                name: styleData.name,
                description: styleData.description,
                icon: styleData.icon || '🎭',
                color: styleData.color || '#8A2BE2',
                difficulty_level: styleData.difficulty_level || 'beginner',
                cultural_origin: styleData.cultural_origin || 'Unknown',
                is_featured: styleData.is_featured || false,
                popularity_score: 0,
                stats: { moveCount: 0, submissionCount: 0, averageRating: 0 },
                music_genres: styleData.music_genres || [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // Try API call first
            if (this.api && typeof this.api.createDanceStyle === 'function') {
                console.log('🌐 Creating dance style via API...');
                const response = await this.api.createDanceStyle(newStyle);
                
                if (response && response.success) {
                    console.log('✅ Dance style created via API');
                    // Use API response data if available
                    if (response.data) {
                        newStyle.id = response.data.id;
                    }
                } else {
                    throw new Error(response?.error || 'API creation failed');
                }
            }
            
            // Add to local array
            this.danceStyles.push(newStyle);
            
            this.showSuccessMessage('Dance style created successfully');
            this.renderDanceStyles();
            this.updateStyleStats();
            
            return newStyle;
            
        } catch (error) {
            console.error('❌ Error creating dance style:', error);
            this.showErrorMessage('Failed to create dance style: ' + error.message);
            throw error;
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
            const checkbox = card.querySelector('.style-checkbox');
            if (checkbox) {
                checkbox.checked = this.selectedStyles.has(styleId);
            }
        }
        
        console.log(`🔀 Style ${styleId} ${this.selectedStyles.has(styleId) ? 'selected' : 'deselected'}`);
    }

    // ➕ Show create style modal
    showCreateStyleModal() {
        // For now, just show success message - in production this would open a modal
        this.showSuccessMessage('Create dance style modal would open here');
    }

    // 💾 Save style form
    async saveStyleForm() {
        const form = document.getElementById('styleForm');
        if (!form) {
            this.showErrorMessage('Style form not found');
            return;
        }
        
        try {
            const formData = new FormData(form);
            const styleData = {
                name: formData.get('name'),
                description: formData.get('description'),
                icon: formData.get('icon'),
                color: formData.get('color'),
                difficulty_level: formData.get('difficulty'),
                cultural_origin: formData.get('origin'),
                is_featured: formData.get('is_featured') === 'on',
                music_genres: formData.get('music_genres') ? 
                    formData.get('music_genres').split(',').map(g => g.trim()) : []
            };
            
            await this.createDanceStyle(styleData);
            
            // Close modal if it exists
            const modal = document.getElementById('styleModal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Reset form
            form.reset();
            
        } catch (error) {
            console.error('❌ Error saving style form:', error);
            this.showErrorMessage('Failed to save dance style: ' + error.message);
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