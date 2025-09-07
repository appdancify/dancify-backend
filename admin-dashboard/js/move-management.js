// Move Management Module
class MoveManager {
    constructor(apiClient) {
        this.api = apiClient;
        this.moves = [];
        this.currentPage = 1;
        this.currentFilters = {};
        this.isLoading = false;
        
        console.log('🕺 Move Manager initialized');
    }

    // 🎯 Initialize move management
    async init() {
        console.log('🕺 Initializing Move Management...');
        
        try {
            await this.loadMoves();
            this.setupEventListeners();
            this.setupFilters();
            
            console.log('✅ Move Management initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Move Management:', error);
            this.showErrorMessage('Failed to initialize move management');
        }
    }

    // 📊 Load moves from API
    async loadMoves(page = 1, filters = {}) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.currentPage = page;
        this.currentFilters = filters;
        
        console.log(`📊 Loading moves (page ${page})...`);
        
        try {
            this.showLoadingState();
            
            // Build query parameters
            const params = new URLSearchParams();
            if (filters.danceStyle) params.append('dance_style', filters.danceStyle);
            if (filters.section) params.append('section', filters.section);
            if (filters.difficulty) params.append('difficulty', filters.difficulty);
            if (filters.search) params.append('search', filters.search);
            
            const queryString = params.toString();
            const endpoint = `/admin/moves${queryString ? `?${queryString}` : ''}`;
            
            console.log('🌐 Requesting:', endpoint);
            
            const response = await this.api.request('GET', endpoint);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch dance moves');
            }
            
            this.moves = response.data || [];
            console.log(`✅ Loaded ${this.moves.length} moves`);
            
            this.renderMoves();
            this.updateMoveStats();
            
        } catch (error) {
            console.error('❌ Failed to load moves:', error);
            this.showErrorMessage('Failed to load moves: ' + error.message);
            this.moves = [];
            this.renderMoves();
        } finally {
            this.isLoading = false;
        }
    }

    // 🎨 Render moves in the grid
    renderMoves() {
        const movesContainer = document.getElementById('movesGrid');
        
        if (!movesContainer) {
            console.error('❌ Moves container not found');
            return;
        }

        if (this.moves.length === 0) {
            movesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🕺</div>
                    <div class="empty-title">No moves found</div>
                    <div class="empty-description">Create your first dance move to get started</div>
                    <button class="btn btn-primary" onclick="moveManager.showCreateMoveModal()">
                        ➕ Create Move
                    </button>
                </div>
            `;
            return;
        }

        const movesHTML = this.moves.map(move => this.createMoveCard(move)).join('');
        movesContainer.innerHTML = movesHTML;
        
        console.log(`✅ Rendered ${this.moves.length} moves`);
    }

    // 🎯 Create move card HTML
    createMoveCard(move) {
        const difficultyColors = {
            'beginner': 'var(--success-color)',
            'intermediate': 'var(--warning-color)',
            'advanced': 'var(--danger-color)'
        };

        const difficultyColor = difficultyColors[move.difficulty] || 'var(--primary-color)';
        const thumbnailUrl = move.thumbnail_url || 'https://via.placeholder.com/300x200?text=No+Video';
        const created = new Date(move.created_at).toLocaleDateString();

        return `
            <div class="move-card" data-move-id="${move.id}">
                <div class="move-thumbnail">
                    <img src="${thumbnailUrl}" alt="${move.name}" loading="lazy" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=No+Video'">
                    <div class="move-overlay">
                        <button class="btn-icon" onclick="moveManager.editMove('${move.id}')" title="Edit Move">
                            ✏️
                        </button>
                        <button class="btn-icon" onclick="moveManager.deleteMove('${move.id}')" title="Delete Move">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="move-info">
                    <div class="move-header">
                        <h3 class="move-title">${move.name}</h3>
                        <span class="difficulty-badge" style="background-color: ${difficultyColor}">
                            ${move.difficulty}
                        </span>
                    </div>
                    <div class="move-meta">
                        <span class="dance-style">💃 ${move.dance_style}</span>
                        <span class="section">📂 ${move.section}</span>
                        ${move.subsection ? `<span class="subsection">📁 ${move.subsection}</span>` : ''}
                    </div>
                    <div class="move-description">
                        ${move.description}
                    </div>
                    <div class="move-stats">
                        <span class="xp-reward">⭐ ${move.xp_reward || 50} XP</span>
                        <span class="created-date">📅 ${created}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // 📈 Update move statistics
    updateMoveStats() {
        const totalMovesEl = document.getElementById('totalMoves');
        const difficultyBreakdownEl = document.getElementById('difficultyBreakdown');
        
        if (totalMovesEl) {
            totalMovesEl.textContent = this.moves.length;
        }
        
        if (difficultyBreakdownEl) {
            const breakdown = this.moves.reduce((acc, move) => {
                acc[move.difficulty] = (acc[move.difficulty] || 0) + 1;
                return acc;
            }, {});
            
            difficultyBreakdownEl.innerHTML = Object.entries(breakdown)
                .map(([difficulty, count]) => `${difficulty}: ${count}`)
                .join(' • ');
        }
    }

    // 🎛️ Setup event listeners
    setupEventListeners() {
        // Create move button
        const createMoveBtn = document.getElementById('createMoveBtn');
        if (createMoveBtn) {
            createMoveBtn.addEventListener('click', () => this.showCreateMoveModal());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshMovesBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadMoves(this.currentPage, this.currentFilters));
        }

        // Search input
        const searchInput = document.getElementById('moveSearchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.search = e.target.value;
                    this.loadMoves(1, this.currentFilters);
                }, 500);
            });
        }
    }

    // 🔍 Setup filters
    setupFilters() {
        const danceStyleFilter = document.getElementById('danceStyleFilter');
        const sectionFilter = document.getElementById('sectionFilter');
        const difficultyFilter = document.getElementById('difficultyFilter');

        [danceStyleFilter, sectionFilter, difficultyFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    this.currentFilters = {
                        danceStyle: danceStyleFilter?.value,
                        section: sectionFilter?.value,
                        difficulty: difficultyFilter?.value,
                        search: this.currentFilters.search
                    };
                    
                    // Remove empty filters
                    Object.keys(this.currentFilters).forEach(key => {
                        if (!this.currentFilters[key]) delete this.currentFilters[key];
                    });
                    
                    this.loadMoves(1, this.currentFilters);
                });
            }
        });
    }

    // ➕ Show create move modal
    showCreateMoveModal() {
        this.showMoveModal(null, true);
    }

    // ✏️ Edit move
    editMove(moveId) {
        const move = this.moves.find(m => m.id === moveId);
        if (move) {
            this.showMoveModal(move, false);
        }
    }

    // 🎯 Show move modal (create or edit)
    showMoveModal(move, isCreateMode) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.innerHTML = this.createMoveModalHTML(move, isCreateMode);
        
        document.body.appendChild(modalOverlay);
        
        // Focus on first input
        setTimeout(() => {
            const firstInput = modalOverlay.querySelector('input, textarea, select');
            if (firstInput) firstInput.focus();
        }, 100);
        
        // Setup modal events
        this.setupMoveModalEvents(modalOverlay, move);
    }

    // 🎨 Create move modal HTML
    createMoveModalHTML(move, isCreateMode) {
        return `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${isCreateMode ? '➕ Create New Move' : '✏️ Edit Move'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <form class="move-form" id="moveForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="moveName">Move Name *</label>
                                <input type="text" id="moveName" name="name" required 
                                       value="${move?.name || ''}" placeholder="Enter move name">
                            </div>
                            <div class="form-group">
                                <label for="danceStyle">Dance Style *</label>
                                <select id="danceStyle" name="dance_style" required>
                                    <option value="">Select style</option>
                                    <option value="hip-hop" ${move?.dance_style === 'hip-hop' ? 'selected' : ''}>Hip Hop</option>
                                    <option value="ballet" ${move?.dance_style === 'ballet' ? 'selected' : ''}>Ballet</option>
                                    <option value="contemporary" ${move?.dance_style === 'contemporary' ? 'selected' : ''}>Contemporary</option>
                                    <option value="jazz" ${move?.dance_style === 'jazz' ? 'selected' : ''}>Jazz</option>
                                    <option value="latin" ${move?.dance_style === 'latin' ? 'selected' : ''}>Latin</option>
                                    <option value="breakdance" ${move?.dance_style === 'breakdance' ? 'selected' : ''}>Breakdance</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="section">Section *</label>
                                <input type="text" id="section" name="section" required 
                                       value="${move?.section || ''}" placeholder="e.g., Basic Steps, Advanced Combos">
                            </div>
                            <div class="form-group">
                                <label for="subsection">Subsection</label>
                                <input type="text" id="subsection" name="subsection" 
                                       value="${move?.subsection || ''}" placeholder="Optional subsection">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="difficulty">Difficulty *</label>
                                <select id="difficulty" name="difficulty" required>
                                    <option value="">Select difficulty</option>
                                    <option value="beginner" ${move?.difficulty === 'beginner' ? 'selected' : ''}>Beginner</option>
                                    <option value="intermediate" ${move?.difficulty === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                                    <option value="advanced" ${move?.difficulty === 'advanced' ? 'selected' : ''}>Advanced</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="xpReward">XP Reward</label>
                                <input type="number" id="xpReward" name="xp_reward" min="10" max="500" 
                                       value="${move?.xp_reward || 50}" placeholder="50">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="videoUrl">Video URL</label>
                            <input type="url" id="videoUrl" name="video_url" 
                                   value="${move?.video_url || ''}" placeholder="https://youtube.com/watch?v=...">
                        </div>
                        
                        <div class="form-group">
                            <label for="moveDescription">Description *</label>
                            <textarea id="moveDescription" name="description" required rows="3" 
                                      placeholder="Brief description of the move">${move?.description || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="detailedInstructions">Detailed Instructions *</label>
                            <textarea id="detailedInstructions" name="detailed_instructions" required rows="5" 
                                      placeholder="Step-by-step instructions for the move">${move?.detailed_instructions || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancel
                    </button>
                    <button class="btn btn-primary" onclick="moveManager.saveMove(${isCreateMode ? 'null' : `'${move?.id || ''}'`})">
                        💾 ${isCreateMode ? 'Create Move' : 'Save Changes'}
                    </button>
                </div>
            </div>
        `;
    }

    // 🎯 Setup move modal events
    setupMoveModalEvents(modal, move) {
        // Add any specific event listeners for the modal
        const form = modal.querySelector('#moveForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveMove(move?.id || null);
            });
        }
    }

    // 💾 Save move
    async saveMove(moveId) {
        try {
            const moveData = {
                name: document.getElementById('moveName').value.trim(),
                description: document.getElementById('moveDescription').value.trim(),
                detailed_instructions: document.getElementById('detailedInstructions').value.trim(),
                dance_style: document.getElementById('danceStyle').value,
                section: document.getElementById('section').value.trim(),
                subsection: document.getElementById('subsection').value.trim(),
                difficulty: document.getElementById('difficulty').value,
                xp_reward: parseInt(document.getElementById('xpReward').value) || 50,
                video_url: document.getElementById('videoUrl').value.trim()
            };
            
            // Validation
            if (!moveData.name || !moveData.description || !moveData.detailed_instructions || 
                !moveData.dance_style || !moveData.section || !moveData.difficulty) {
                throw new Error('Please fill in all required fields');
            }
            
            console.log('💾 Saving move:', moveId ? 'UPDATE' : 'CREATE', moveData);
            
            const response = moveId ? 
                await this.api.request('PUT', `/admin/moves/${moveId}`, moveData) :
                await this.api.request('POST', '/admin/moves', moveData);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to save move');
            }
            
            this.showSuccessMessage(moveId ? 'Move updated successfully' : 'Move created successfully');
            document.querySelector('.modal-overlay').remove();
            await this.loadMoves(this.currentPage, this.currentFilters);
            
        } catch (error) {
            console.error('❌ Failed to save move:', error);
            this.showErrorMessage('Failed to save move: ' + error.message);
        }
    }

    // 🗑️ Delete move
    async deleteMove(moveId) {
        const move = this.moves.find(m => m.id === moveId);
        if (!move) return;
        
        const confirmed = confirm(`Are you sure you want to delete the move "${move.name}"?\n\nThis action cannot be undone.`);
        if (!confirmed) return;
        
        try {
            console.log('🗑️ Deleting move:', moveId);
            
            const response = await this.api.request('DELETE', `/admin/moves/${moveId}`);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to delete move');
            }
            
            this.showSuccessMessage('Move deleted successfully');
            await this.loadMoves(this.currentPage, this.currentFilters);
            
        } catch (error) {
            console.error('❌ Failed to delete move:', error);
            this.showErrorMessage('Failed to delete move: ' + error.message);
        }
    }

    // 🔄 Loading states
    showLoadingState() {
        const movesContainer = document.getElementById('movesGrid');
        if (movesContainer) {
            movesContainer.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <div>Loading moves...</div>
                </div>
            `;
        }
    }

    hideLoadingState() {
        // Loading state will be replaced by renderMoves()
    }

    // 💬 Message helpers
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

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

// Export for global use
window.MoveManager = MoveManager;