// 💃 Dancify Admin Dashboard - Move Management
// Real-time dance move management with backend integration

class MoveManager {
    constructor(apiClient) {
        this.api = apiClient;
        this.moves = [];
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalMoves = 0;
        this.currentFilters = {};
        this.selectedMoves = new Set();
        
        console.log('🕺 Move Manager initialized');
    }

    // 🚀 Initialize move management
    async init() {
        try {
            console.log('🕺 Initializing Move Management...');
            
            // Load initial data
            await this.loadMoves();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up real-time updates
            this.setupRealTimeUpdates();
            
            console.log('✅ Move Management initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Move Management:', error);
            this.showErrorMessage('Failed to initialize move management: ' + error.message);
        }
    }

    // 📊 Load moves from API - FIXED to work with updated server response
    async loadMoves(page = 1, filters = {}) {
        try {
            console.log(`📊 Loading moves (page ${page})...`);
            
            this.showLoadingState();
            
            const queryParams = {
                page,
                limit: this.pageSize,
                ...filters
            };
            
            // Use the updated API endpoint structure
            const response = await this.api.request('GET', '/admin/moves', null, { params: queryParams });
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load moves');
            }
            
            this.moves = response.data || [];
            this.currentPage = page;
            // Handle pagination from server response
            this.totalMoves = response.pagination ? response.pagination.total : (response.data ? response.data.length : 0);
            this.currentFilters = filters;
            
            this.renderMoves();
            this.renderPagination();
            this.updateMoveStats();
            
            this.hideLoadingState();
            
            console.log(`✅ Loaded ${this.moves.length} moves`);
            
        } catch (error) {
            console.error('❌ Failed to load moves:', error);
            this.hideLoadingState();
            this.showErrorMessage('Failed to load moves: ' + error.message);
        }
    }

    // 🎨 Render moves grid
    renderMoves() {
        const movesContainer = document.getElementById('movesGrid');
        if (!movesContainer) {
            console.warn('⚠️ Moves grid container not found');
            return;
        }
        
        if (this.moves.length === 0) {
            movesContainer.innerHTML = `
                <div class="no-data">
                    <div class="no-data-content">
                        <div class="no-data-icon">🕺</div>
                        <div class="no-data-text">No moves found</div>
                        <div class="no-data-subtitle">Try adjusting your filters or create a new move</div>
                        <button class="btn btn-primary" onclick="moveManager.showCreateMoveModal()">
                            ➕ Create Move
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        const moveCards = this.moves.map(move => this.createMoveCard(move)).join('');
        movesContainer.innerHTML = moveCards;
    }

    // 🎭 Create move card - FIXED field names to match database schema
    createMoveCard(move) {
        const isSelected = this.selectedMoves.has(move.id);
        const difficultyColor = this.getDifficultyColor(move.difficulty);
        const thumbnail = move.thumbnail_url || (move.video_id ? `https://img.youtube.com/vi/${move.video_id}/maxresdefault.jpg` : '/admin/assets/placeholder-video.jpg');
        const viewCount = move.view_count || 0;
        const submissionCount = move.submission_count || 0;
        
        return `
            <div class="move-card ${isSelected ? 'selected' : ''}" data-move-id="${move.id}">
                <div class="move-card-header">
                    <input type="checkbox" class="move-checkbox" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="moveManager.toggleMoveSelection('${move.id}')">
                    <div class="move-actions">
                        <button class="btn btn-sm btn-ghost" onclick="moveManager.viewMove('${move.id}')" title="View Details">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="moveManager.editMove('${move.id}')" title="Edit Move">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="moveManager.deleteMove('${move.id}')" title="Delete Move">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <div class="move-thumbnail">
                    <img src="${thumbnail}" alt="${move.name}" loading="lazy" onerror="this.src='/admin/assets/placeholder-video.jpg'">
                    <div class="move-overlay">
                        <button class="play-button" onclick="moveManager.playVideo('${move.video_id || ''}')">
                            ▶️
                        </button>
                    </div>
                </div>
                
                <div class="move-info">
                    <h3 class="move-title">${move.name}</h3>
                    <p class="move-description">${move.description || 'No description available'}</p>
                    
                    <div class="move-meta">
                        <span class="move-style">${move.dance_style || 'Unknown'}</span>
                        <span class="move-difficulty" style="color: ${difficultyColor}">
                            ${move.difficulty || 'beginner'}
                        </span>
                    </div>
                    
                    <div class="move-section">
                        <span class="section-badge">${move.section || 'General'}</span>
                        ${move.subsection ? `<span class="subsection-badge">${move.subsection}</span>` : ''}
                    </div>
                    
                    <div class="move-stats">
                        <div class="stat">
                            <span class="stat-icon">👁️</span>
                            <span class="stat-value">${viewCount.toLocaleString()}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-icon">📹</span>
                            <span class="stat-value">${submissionCount}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-icon">⭐</span>
                            <span class="stat-value">${move.xp_reward || 0} XP</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 🎨 Get difficulty color
    getDifficultyColor(difficulty) {
        const colors = {
            'beginner': '#28a745',
            'intermediate': '#ffc107',
            'advanced': '#fd7e14',
            'expert': '#dc3545'
        };
        return colors[difficulty] || '#6c757d';
    }

    // 📄 Render pagination - FIXED to use correct total from pagination object
    renderPagination() {
        const paginationContainer = document.getElementById('movesPagination');
        if (!paginationContainer) return;
        
        const totalPages = Math.ceil(this.totalMoves / this.pageSize);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `
                <button class="pagination-item" onclick="moveManager.loadMoves(${this.currentPage - 1}, moveManager.currentFilters)">
                    ← Previous
                </button>
            `;
        }
        
        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-item ${i === this.currentPage ? 'active' : ''}" 
                        onclick="moveManager.loadMoves(${i}, moveManager.currentFilters)">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <button class="pagination-item" onclick="moveManager.loadMoves(${this.currentPage + 1}, moveManager.currentFilters)">
                    Next →
                </button>
            `;
        }
        
        paginationContainer.innerHTML = paginationHTML;
    }

    // 📊 Update move statistics
    updateMoveStats() {
        const stats = {
            total: this.totalMoves,
            beginner: this.moves.filter(m => m.difficulty === 'beginner').length,
            intermediate: this.moves.filter(m => m.difficulty === 'intermediate').length,
            advanced: this.moves.filter(m => m.difficulty === 'advanced').length,
            expert: this.moves.filter(m => m.difficulty === 'expert').length
        };
        
        // Update stat cards
        const totalMovesEl = document.getElementById('totalMovesCount');
        const beginnerMovesEl = document.getElementById('beginnerMovesCount');
        const intermediateMovesEl = document.getElementById('intermediateMovesCount');
        const advancedMovesEl = document.getElementById('advancedMovesCount');
        
        if (totalMovesEl) totalMovesEl.textContent = stats.total.toLocaleString();
        if (beginnerMovesEl) beginnerMovesEl.textContent = stats.beginner.toLocaleString();
        if (intermediateMovesEl) intermediateMovesEl.textContent = stats.intermediate.toLocaleString();
        if (advancedMovesEl) advancedMovesEl.textContent = stats.advanced.toLocaleString();
    }

    // 🎯 Set up event listeners
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('moveSearchInput');
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
        const filterElements = ['danceStyleFilter', 'difficultyFilter', 'sectionFilter'];
        filterElements.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', () => {
                    this.applyFilters();
                });
            }
        });

        // Create move button
        const createBtn = document.getElementById('createMoveBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateMoveModal();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshMovesBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshMoves();
            });
        }
    }

    // 🔄 Set up real-time updates
    setupRealTimeUpdates() {
        // Refresh data every 5 minutes
        setInterval(() => {
            console.log('🔄 Auto-refreshing move data...');
            this.loadMoves(this.currentPage, this.currentFilters);
        }, 5 * 60 * 1000);
    }

    // 🔍 Apply filters
    async applyFilters() {
        const searchInput = document.getElementById('moveSearchInput');
        const styleFilter = document.getElementById('danceStyleFilter');
        const difficultyFilter = document.getElementById('difficultyFilter');
        const sectionFilter = document.getElementById('sectionFilter');

        const filters = {};

        if (searchInput?.value.trim()) {
            filters.search = searchInput.value.trim();
        }
        if (styleFilter?.value) {
            filters.dance_style = styleFilter.value;
        }
        if (difficultyFilter?.value) {
            filters.difficulty = difficultyFilter.value;
        }
        if (sectionFilter?.value) {
            filters.section = sectionFilter.value;
        }

        await this.loadMoves(1, filters);
    }

    // 🧹 Clear filters
    async clearFilters() {
        const searchInput = document.getElementById('moveSearchInput');
        const styleFilter = document.getElementById('danceStyleFilter');
        const difficultyFilter = document.getElementById('difficultyFilter');
        const sectionFilter = document.getElementById('sectionFilter');
        
        if (searchInput) searchInput.value = '';
        if (styleFilter) styleFilter.value = '';
        if (difficultyFilter) difficultyFilter.value = '';
        if (sectionFilter) sectionFilter.value = '';

        await this.loadMoves(1, {});
    }

    // 🔄 Refresh moves
    async refreshMoves() {
        console.log('🔄 Refreshing move data...');
        await this.loadMoves(this.currentPage, this.currentFilters);
        this.showSuccessMessage('Move data refreshed successfully');
    }

    // ✅ Toggle move selection
    toggleMoveSelection(moveId) {
        if (this.selectedMoves.has(moveId)) {
            this.selectedMoves.delete(moveId);
        } else {
            this.selectedMoves.add(moveId);
        }
        
        this.updateBulkActionButtons();
    }

    // 🎯 Update bulk action buttons
    updateBulkActionButtons() {
        const bulkActionContainer = document.getElementById('bulkActionContainer');
        const selectedCount = this.selectedMoves.size;
        
        if (bulkActionContainer) {
            if (selectedCount > 0) {
                bulkActionContainer.style.display = 'block';
                const countElement = bulkActionContainer.querySelector('.selected-count');
                if (countElement) {
                    countElement.textContent = selectedCount;
                }
            } else {
                bulkActionContainer.style.display = 'none';
            }
        }
    }

    // ▶️ Play video
    playVideo(videoId) {
        if (!videoId) {
            this.showErrorMessage('No video available for this move');
            return;
        }
        
        const videoModal = document.createElement('div');
        videoModal.className = 'modal-overlay video-modal';
        videoModal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h2>🎥 Video Preview</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="video-container">
                        <iframe 
                            src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                            frameborder="0" 
                            allowfullscreen
                            allow="autoplay">
                        </iframe>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(videoModal);
    }

    // 👁️ View move details - FIXED API call
    async viewMove(moveId) {
        try {
            const response = await this.api.request('GET', `/moves/${moveId}`);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load move');
            }
            
            this.showMoveModal(response.data, 'view');
            
        } catch (error) {
            console.error('❌ Failed to load move:', error);
            this.showErrorMessage('Failed to load move details: ' + error.message);
        }
    }

    // ✏️ Edit move - FIXED API call
    async editMove(moveId) {
        try {
            const response = await this.api.request('GET', `/moves/${moveId}`);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load move');
            }
            
            this.showMoveModal(response.data, 'edit');
            
        } catch (error) {
            console.error('❌ Failed to load move for editing:', error);
            this.showErrorMessage('Failed to load move for editing: ' + error.message);
        }
    }

    // ➕ Show create move modal
    showCreateMoveModal() {
        this.showMoveModal(null, 'create');
    }

    // 📱 Show move modal
    showMoveModal(move, mode = 'view') {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = this.createMoveModalHTML(move, mode);
        
        document.body.appendChild(modal);
        
        if (mode === 'edit' || mode === 'create') {
            this.setupMoveModalEvents(modal, move);
        }
    }

    // 🎨 Create move modal HTML - FIXED field names to match database schema
    createMoveModalHTML(move, mode) {
        const isEditMode = mode === 'edit' || mode === 'create';
        const isCreateMode = mode === 'create';
        const title = isCreateMode ? '➕ Create Move' : isEditMode ? '✏️ Edit Move' : '👁️ Move Details';
        
        const moveData = move || {
            name: '',
            description: '',
            detailed_instructions: '',
            dance_style: '',
            section: '',
            subsection: '',
            difficulty: 'beginner',
            level_required: 1,
            xp_reward: 50,
            estimated_duration: 10,
            move_type: 'time',
            video_url: '',
            key_techniques: []
        };
        
        return `
            <div class="modal modal-xl">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                
                <div class="modal-body">
                    <div class="move-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Move Name *</label>
                                ${isEditMode ? 
                                    `<input type="text" class="form-control" id="moveName" value="${moveData.name || ''}" placeholder="Enter move name" required>` :
                                    `<div class="form-value">${moveData.name || 'Unnamed Move'}</div>`
                                }
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Dance Style *</label>
                                ${isEditMode ? 
                                    `<select class="form-control" id="danceStyle" required>
                                        <option value="">Select dance style</option>
                                        <option value="ballet" ${moveData.dance_style === 'ballet' ? 'selected' : ''}>Ballet</option>
                                        <option value="hip-hop" ${moveData.dance_style === 'hip-hop' ? 'selected' : ''}>Hip-Hop</option>
                                        <option value="salsa" ${moveData.dance_style === 'salsa' ? 'selected' : ''}>Salsa</option>
                                        <option value="contemporary" ${moveData.dance_style === 'contemporary' ? 'selected' : ''}>Contemporary</option>
                                        <option value="jazz" ${moveData.dance_style === 'jazz' ? 'selected' : ''}>Jazz</option>
                                        <option value="ballroom" ${moveData.dance_style === 'ballroom' ? 'selected' : ''}>Ballroom</option>
                                        <option value="latin" ${moveData.dance_style === 'latin' ? 'selected' : ''}>Latin</option>
                                        <option value="breaking" ${moveData.dance_style === 'breaking' ? 'selected' : ''}>Breaking</option>
                                        <option value="house" ${moveData.dance_style === 'house' ? 'selected' : ''}>House</option>
                                    </select>` :
                                    `<div class="form-value">${moveData.dance_style || 'Unknown'}</div>`
                                }
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Description *</label>
                            ${isEditMode ? 
                                `<textarea class="form-control" id="moveDescription" rows="3" placeholder="Brief description of the move" required>${moveData.description || ''}</textarea>` :
                                `<div class="form-value">${moveData.description || 'No description available'}</div>`
                            }
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Detailed Instructions *</label>
                            ${isEditMode ? 
                                `<textarea class="form-control" id="detailedInstructions" rows="5" placeholder="Step-by-step instructions" required>${moveData.detailed_instructions || ''}</textarea>` :
                                `<div class="form-value">${moveData.detailed_instructions || 'No detailed instructions available'}</div>`
                            }
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Section *</label>
                                ${isEditMode ? 
                                    `<input type="text" class="form-control" id="section" value="${moveData.section || ''}" placeholder="e.g., Basic Positions" required>` :
                                    `<div class="form-value">${moveData.section || 'General'}</div>`
                                }
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Subsection</label>
                                ${isEditMode ? 
                                    `<input type="text" class="form-control" id="subsection" value="${moveData.subsection || ''}" placeholder="e.g., Foundation">` :
                                    `<div class="form-value">${moveData.subsection || 'None'}</div>`
                                }
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Difficulty *</label>
                                ${isEditMode ? 
                                    `<select class="form-control" id="difficulty" required>
                                        <option value="beginner" ${moveData.difficulty === 'beginner' ? 'selected' : ''}>Beginner</option>
                                        <option value="intermediate" ${moveData.difficulty === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                                        <option value="advanced" ${moveData.difficulty === 'advanced' ? 'selected' : ''}>Advanced</option>
                                        <option value="expert" ${moveData.difficulty === 'expert' ? 'selected' : ''}>Expert</option>
                                    </select>` :
                                    `<div class="form-value" style="color: ${this.getDifficultyColor(moveData.difficulty)}">${moveData.difficulty || 'beginner'}</div>`
                                }
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">XP Reward</label>
                                ${isEditMode ? 
                                    `<input type="number" class="form-control" id="xpReward" value="${moveData.xp_reward || 50}" min="0" max="500">` :
                                    `<div class="form-value">${moveData.xp_reward || 0} XP</div>`
                                }
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Video URL</label>
                            ${isEditMode ? 
                                `<input type="url" class="form-control" id="videoUrl" value="${moveData.video_url || ''}" placeholder="https://youtube.com/watch?v=...">` :
                                `<div class="form-value">
                                    ${moveData.video_url ? 
                                        `<a href="${moveData.video_url}" target="_blank">${moveData.video_url}</a>` : 
                                        'No video URL'
                                    }
                                </div>`
                            }
                        </div>
                        
                        ${!isEditMode && moveData.video_id ? `
                            <div class="form-group">
                                <label class="form-label">Video Preview</label>
                                <div class="video-preview">
                                    <img src="https://img.youtube.com/vi/${moveData.video_id}/maxresdefault.jpg" 
                                         alt="Video thumbnail" 
                                         onclick="moveManager.playVideo('${moveData.video_id}')"
                                         style="cursor: pointer; max-width: 300px;">
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${isEditMode ? `
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Cancel
                        </button>
                        <button class="btn btn-primary" onclick="moveManager.saveMove(${isCreateMode ? 'null' : `'${move?.id || ''}'`})">
                            💾 ${isCreateMode ? 'Create Move' : 'Save Changes'}
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // 🎯 Setup move modal events
    setupMoveModalEvents(modal, move) {
        // Add any specific event listeners for the modal
    }

    // 💾 Save move - FIXED to use proper API endpoints and field names
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

    // 🗑️ Delete move - FIXED to use proper API endpoint
    async deleteMove(moveId) {
        const move = this.moves.find(m => m.id === moveId);
        if (!move) return;
        
        const confirmed = confirm(`Are you sure you want to delete the move "${move.name}"? This action cannot be undone.`);
        if (!confirmed) return;
        
        try {
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