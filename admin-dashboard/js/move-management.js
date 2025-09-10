// Move Management System with Dynamic Dance Style Loading
class MoveManager {
    constructor() {
        this.moves = [];
        this.danceStyles = []; // Store loaded dance styles
        this.selectedMoves = new Set();
        this.currentPage = 1;
        this.movesPerPage = 12;
        this.totalPages = 1;
        this.currentFilters = {};
        this.isInitialized = false;
        
        console.log('MoveManager initialized');
    }

    // Initialize the move management system
    async init() {
        try {
            console.log('Initializing Move Management...');
            
            // Wait for DOM to be ready
            await this.waitForDOMReady();
            
            // Load dance styles first, then moves
            await this.loadDanceStyles();
            await this.loadMoves();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initial render
            this.renderMoves();
            this.updateMoveStats();
            
            this.isInitialized = true;
            console.log('Move Management initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Move Management:', error);
            this.showErrorMessage('Failed to initialize move management: ' + error.message);
        }
    }

    // Wait for DOM to be ready
    async waitForDOMReady(maxWait = 5000) {
        const startTime = Date.now();
        let foundElements = 0;
        
        while (foundElements < 1 && (Date.now() - startTime) < maxWait) {
            const requiredElements = ['movesGrid', 'createMoveBtn', 'moveSearchInput'];
            foundElements = requiredElements.filter(id => document.getElementById(id) !== null).length;
            
            if (foundElements >= 1) {
                console.log(`Found ${foundElements}/3 required DOM elements`);
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`Proceeding with DOM readiness (${foundElements}/3 elements found)`);
        return true;
    }

    // Load dance styles from API
    async loadDanceStyles() {
        try {
            console.log('Loading dance styles...');
            
            const response = await fetch('/api/admin/dance-styles');
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.danceStyles = result.data || [];
                console.log(`Loaded ${this.danceStyles.length} dance styles`);
            } else {
                console.error('Failed to load dance styles:', result.error);
                this.danceStyles = [];
            }
        } catch (error) {
            console.error('Error loading dance styles:', error);
            this.danceStyles = [];
        }
    }

    // Load moves from API
    async loadMoves() {
        try {
            console.log('Loading moves...');
            
            const response = await fetch('/api/admin/moves');
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.moves = result.data || [];
                console.log(`Loaded ${this.moves.length} moves`);
            } else {
                console.error('Failed to load moves:', result.error);
                this.moves = [];
            }
        } catch (error) {
            console.error('Error loading moves:', error);
            this.moves = [];
        }
    }

    // Setup event listeners
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Remove existing listeners to prevent duplicates
        this.removeEventListeners();
        
        setTimeout(() => {
            // Create move button
            let createMoveBtn = document.getElementById('createMoveBtn');
            if (!createMoveBtn) {
                createMoveBtn = document.querySelector('.btn[onclick*="create"], button[title*="Create"], .header-actions .btn-primary');
            }
            
            if (createMoveBtn) {
                this.createMoveBtnHandler = (e) => {
                    e.preventDefault();
                    this.showCreateMoveModal();
                };
                createMoveBtn.addEventListener('click', this.createMoveBtnHandler);
                console.log('Create move button listener added');
            }

            // Refresh button
            let refreshBtn = document.getElementById('refreshMovesBtn');
            if (refreshBtn) {
                this.refreshBtnHandler = () => this.loadMoves();
                refreshBtn.addEventListener('click', this.refreshBtnHandler);
                console.log('Refresh button listener added');
            }

            // Search input
            let searchInput = document.getElementById('moveSearchInput');
            if (searchInput) {
                this.searchInputHandler = (e) => {
                    this.currentFilters.search = e.target.value.trim();
                    this.applyFilters();
                };
                searchInput.addEventListener('input', this.searchInputHandler);
                console.log('Search input listener added');
            }

            console.log('Event listeners setup complete');
        }, 300);
    }

    // Remove event listeners to prevent duplicates
    removeEventListeners() {
        const createMoveBtn = document.getElementById('createMoveBtn');
        if (createMoveBtn && this.createMoveBtnHandler) {
            createMoveBtn.removeEventListener('click', this.createMoveBtnHandler);
        }

        const refreshBtn = document.getElementById('refreshMovesBtn');
        if (refreshBtn && this.refreshBtnHandler) {
            refreshBtn.removeEventListener('click', this.refreshBtnHandler);
        }

        const searchInput = document.getElementById('moveSearchInput');
        if (searchInput && this.searchInputHandler) {
            searchInput.removeEventListener('input', this.searchInputHandler);
        }
    }

    // Render moves grid
    renderMoves() {
        let movesContainer = document.getElementById('movesGrid');
        if (!movesContainer) {
            movesContainer = document.querySelector('.moves-grid, [id*="moves"], .move-container');
        }
        
        if (!movesContainer) {
            console.warn('Moves container not found - trying to create one');
            
            const parentContainer = document.querySelector('.moves-container, .content-section, #move-management');
            if (parentContainer) {
                movesContainer = document.createElement('div');
                movesContainer.id = 'movesGrid';
                movesContainer.className = 'moves-grid';
                parentContainer.appendChild(movesContainer);
                console.log('Created moves container');
            } else {
                console.error('Cannot find suitable parent for moves container');
                return;
            }
        }

        if (!this.moves || this.moves.length === 0) {
            movesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💃</div>
                    <div class="empty-title">No Dance Moves Found</div>
                    <div class="empty-description">Create your first dance move to get started</div>
                    <button class="btn btn-primary" onclick="window.moveManager.showCreateMoveModal()">
                        Create Move
                    </button>
                </div>
            `;
            return;
        }

        const movesHTML = this.moves.map(move => this.createMoveCard(move)).join('');
        movesContainer.innerHTML = movesHTML;
        
        console.log(`Rendered ${this.moves.length} moves`);
    }

    // Create move card HTML
    createMoveCard(move) {
        const difficultyColors = {
            'beginner': '#28A745',
            'intermediate': '#FFC107', 
            'advanced': '#DC3545',
            'expert': '#6F42C1'
        };

        const difficultyColor = difficultyColors[move.difficulty] || '#8A2BE2';
        const thumbnailUrl = move.thumbnail_url || 'https://via.placeholder.com/300x200?text=No+Video';
        const created = new Date(move.created_at).toLocaleDateString();
        const viewCount = move.view_count || 0;
        const rating = move.rating || 0;

        return `
            <div class="move-card" data-move-id="${move.id}">
                <div class="move-thumbnail">
                    <img src="${thumbnailUrl}" alt="${move.name}" loading="lazy" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=No+Video'">
                    <div class="move-overlay">
                        <button class="btn-icon" onclick="window.moveManager.editMove('${move.id}')" title="Edit Move">
                            Edit
                        </button>
                        <button class="btn-icon" onclick="window.moveManager.deleteMove('${move.id}')" title="Delete Move">
                            Delete
                        </button>
                    </div>
                    ${move.video_url ? `<div class="play-button">▶</div>` : ''}
                </div>
                <div class="move-info">
                    <div class="move-header">
                        <h3 class="move-title">${move.name}</h3>
                        <span class="difficulty-badge" style="background-color: ${difficultyColor}; color: white;">
                            ${move.difficulty}
                        </span>
                    </div>
                    <div class="move-meta">
                        <span class="dance-style">${move.dance_style}</span>
                        <span class="section">${move.section}</span>
                        ${move.subsection ? `<span class="subsection">${move.subsection}</span>` : ''}
                    </div>
                    <div class="move-description">${move.description}</div>
                    <div class="move-stats">
                        <span class="xp">XP: ${move.xp_reward}</span>
                        <span class="created">Created: ${created}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Update move statistics
    updateMoveStats() {
        try {
            const totalMovesEl = document.getElementById('totalMoves');
            
            if (!this.moves || this.moves.length === 0) {
                if (totalMovesEl) totalMovesEl.textContent = '0';
                return;
            }
            
            if (totalMovesEl) {
                totalMovesEl.textContent = this.moves.length.toLocaleString();
            }
            
            console.log('Move statistics updated');
        } catch (error) {
            console.error('Error updating move statistics:', error);
        }
    }

    // Show create move modal
    showCreateMoveModal() {
        this.showMoveModal(null, true);
    }

    // Edit move
    editMove(moveId) {
        const move = this.moves.find(m => m.id === moveId);
        if (move) {
            this.showMoveModal(move, false);
        } else {
            this.showErrorMessage('Move not found');
        }
    }

    // Show move modal
    showMoveModal(move, isCreateMode) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay show';
        modalOverlay.innerHTML = this.createMoveModalHTML(move, isCreateMode);
        
        document.body.appendChild(modalOverlay);
        
        setTimeout(() => {
            const firstInput = modalOverlay.querySelector('input, textarea, select');
            if (firstInput) firstInput.focus();
        }, 100);
        
        this.setupMoveModalEvents(modalOverlay, move, isCreateMode);
    }

    // Create move modal HTML with DYNAMIC dance style options
    createMoveModalHTML(move, isCreateMode) {
        // Generate dance style options dynamically from loaded dance styles
        const danceStyleOptions = this.danceStyles.length > 0 
            ? this.danceStyles.map(style => 
                `<option value="${style.name}" ${move?.dance_style === style.name ? 'selected' : ''}>${style.name}</option>`
              ).join('')
            : '<option value="">No dance styles available - create some first</option>';

        return `
            <div class="modal">
                <div class="modal-header">
                    <h2>${isCreateMode ? 'Create New Move' : 'Edit Move'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <form class="move-form" id="moveForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="moveName">Move Name *</label>
                                <input type="text" id="moveName" name="name" required 
                                       value="${move?.name || ''}" placeholder="Enter move name">
                                <div class="error-message" id="nameError"></div>
                            </div>
                            <div class="form-group">
                                <label for="danceStyle">Dance Style *</label>
                                <select id="danceStyle" name="dance_style" required>
                                    <option value="">Select style</option>
                                    ${danceStyleOptions}
                                </select>
                                <div class="error-message" id="danceStyleError"></div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="section">Section *</label>
                                <input type="text" id="section" name="section" required 
                                       value="${move?.section || 'Basic Steps'}" placeholder="e.g., Basic Steps">
                                <div class="error-message" id="sectionError"></div>
                            </div>
                            <div class="form-group">
                                <label for="subsection">Subsection</label>
                                <input type="text" id="subsection" name="subsection" 
                                       value="${move?.subsection || ''}" placeholder="Optional">
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
                                    <option value="expert" ${move?.difficulty === 'expert' ? 'selected' : ''}>Expert</option>
                                </select>
                                <div class="error-message" id="difficultyError"></div>
                            </div>
                            <div class="form-group">
                                <label for="xpReward">XP Reward</label>
                                <input type="number" id="xpReward" name="xp_reward" min="1" max="1000"
                                       value="${move?.xp_reward || 50}" placeholder="50">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="videoUrl">Video URL</label>
                            <input type="url" id="videoUrl" name="video_url" 
                                   value="${move?.video_url || ''}" 
                                   placeholder="https://youtube.com/watch?v=...">
                        </div>
                        
                        <div class="form-group">
                            <label for="description">Description *</label>
                            <textarea id="description" name="description" required rows="3"
                                      placeholder="Brief description">${move?.description || ''}</textarea>
                            <div class="error-message" id="descriptionError"></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="detailedInstructions">Detailed Instructions *</label>
                            <textarea id="detailedInstructions" name="detailed_instructions" required rows="5"
                                      placeholder="Step-by-step instructions">${move?.detailed_instructions || ''}</textarea>
                            <div class="error-message" id="instructionsError"></div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancel
                    </button>
                    <button type="button" class="btn btn-primary" onclick="window.moveManager.saveMove('${isCreateMode ? 'create' : 'edit'}', '${move?.id || ''}')">
                        ${isCreateMode ? 'Create Move' : 'Save Changes'}
                    </button>
                </div>
            </div>
        `;
    }

    // Setup move modal events
    setupMoveModalEvents(modal, move, isCreateMode) {
        const form = modal.querySelector('#moveForm');
        
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveMove(isCreateMode ? 'create' : 'edit', move?.id || '');
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

    // Save move
    async saveMove(mode, moveId) {
        try {
            const form = document.getElementById('moveForm');
            if (!form) throw new Error('Form not found');
            
            // Clear previous errors
            const errorElements = form.querySelectorAll('.error-message');
            errorElements.forEach(el => el.textContent = '');
            
            const formData = new FormData(form);
            
            const moveData = {
                name: formData.get('name'),
                dance_style: formData.get('dance_style'),
                section: formData.get('section'),
                subsection: formData.get('subsection'),
                difficulty: formData.get('difficulty'),
                xp_reward: parseInt(formData.get('xp_reward')) || 50,
                video_url: formData.get('video_url'),
                description: formData.get('description'),
                detailed_instructions: formData.get('detailed_instructions')
            };
            
            // Validate required fields
            const errors = {};
            if (!moveData.name) errors.nameError = 'Move name is required';
            if (!moveData.dance_style) errors.danceStyleError = 'Dance style is required';
            if (!moveData.section) errors.sectionError = 'Section is required';
            if (!moveData.difficulty) errors.difficultyError = 'Difficulty is required';
            if (!moveData.description) errors.descriptionError = 'Description is required';
            if (!moveData.detailed_instructions) errors.instructionsError = 'Detailed instructions are required';
            
            // Display errors if any
            if (Object.keys(errors).length > 0) {
                Object.entries(errors).forEach(([id, message]) => {
                    const errorEl = document.getElementById(id);
                    if (errorEl) errorEl.textContent = message;
                });
                return;
            }
            
            let response;
            
            if (mode === 'create') {
                const fetchResponse = await fetch('/api/admin/moves', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(moveData)
                });
                response = await fetchResponse.json();
                
                if (fetchResponse.ok && response.success) {
                    this.moves.unshift(response.data);
                    this.showSuccessMessage('Move created successfully');
                } else {
                    throw new Error(response?.error || 'Failed to create move');
                }
            } else {
                const fetchResponse = await fetch(`/api/admin/moves/${moveId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(moveData)
                });
                response = await fetchResponse.json();
                
                if (fetchResponse.ok && response.success) {
                    const index = this.moves.findIndex(m => m.id === moveId);
                    if (index !== -1) {
                        this.moves[index] = { ...this.moves[index], ...response.data };
                    }
                    this.showSuccessMessage('Move updated successfully');
                } else {
                    throw new Error(response?.error || 'Failed to update move');
                }
            }
            
            // Close modal and refresh
            const modal = document.querySelector('.modal-overlay');
            if (modal) modal.remove();
            
            this.renderMoves();
            this.updateMoveStats();
            
        } catch (error) {
            console.error('Error saving move:', error);
            this.showErrorMessage('Failed to save move: ' + error.message);
        }
    }

    // Delete move
    async deleteMove(moveId) {
        const move = this.moves.find(m => m.id === moveId);
        if (!move) {
            this.showErrorMessage('Move not found');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete "${move.name}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/admin/moves/${moveId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.moves = this.moves.filter(m => m.id !== moveId);
                this.selectedMoves.delete(moveId);
                this.showSuccessMessage('Move deleted successfully');
                this.renderMoves();
                this.updateMoveStats();
            } else {
                throw new Error(result?.error || 'Failed to delete move');
            }
        } catch (error) {
            console.error('Error deleting move:', error);
            this.showErrorMessage('Failed to delete move: ' + error.message);
        }
    }

    // Apply filters
    applyFilters() {
        let filteredMoves = [...this.moves];
        
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filteredMoves = filteredMoves.filter(move => 
                move.name.toLowerCase().includes(searchTerm) ||
                move.description.toLowerCase().includes(searchTerm) ||
                move.dance_style.toLowerCase().includes(searchTerm)
            );
        }
        
        const originalMoves = this.moves;
        this.moves = filteredMoves;
        this.renderMoves();
        this.moves = originalMoves;
        
        console.log(`Applied filters, showing ${filteredMoves.length} of ${originalMoves.length} moves`);
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
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.innerHTML = `
            <span class="message-text">${message}</span>
            <button class="message-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        messageDiv.style.cssText = `
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
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// Initialize the Move Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!window.moveManager) {
        window.moveManager = new MoveManager();
        window.moveManager.init();
        console.log('Move Manager ready');
    }
});

// Export for global use
window.MoveManager = MoveManager;