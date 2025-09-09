// Move Management System with Dynamic Dance Style Loading
class MoveManager {
    constructor(apiClient) {
        this.api = apiClient;
        this.moves = [];
        this.danceStyles = []; // Add this to store available dance styles
        this.isLoading = false;
        
        console.log('MoveManager initialized');
    }

    // Initialize move management
    async init() {
        try {
            console.log('Initializing Move Management...');
            
            // Check if API client is available
            if (!this.api) {
                console.log('No API client available, using localStorage fallback');
                this.initializeAPI();
            }
            
            // Load dance styles first, then moves
            await this.loadDanceStyles();
            await this.loadMoves();
            this.setupEventListeners();
            
            console.log('Move Management initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Move Management:', error);
        }
    }

    // Initialize API fallback
    initializeAPI() {
        this.api = {
            request: async (method, endpoint, data) => {
                console.log(`API ${method} ${endpoint}`, data);
                
                // Simulate API responses for localStorage fallback
                if (endpoint.includes('/admin/moves')) {
                    if (method === 'GET') {
                        const moves = JSON.parse(localStorage.getItem('dancify_moves') || '[]');
                        return { success: true, data: moves };
                    } else if (method === 'POST') {
                        const moves = JSON.parse(localStorage.getItem('dancify_moves') || '[]');
                        const newMove = { ...data, id: Date.now().toString() };
                        moves.push(newMove);
                        localStorage.setItem('dancify_moves', JSON.stringify(moves));
                        return { success: true, data: newMove };
                    }
                }
                
                return { success: false, error: 'API not available' };
            }
        };
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
                // Fallback to empty array
                this.danceStyles = [];
            }
        } catch (error) {
            console.error('Error loading dance styles:', error);
            this.danceStyles = [];
        }
    }

    // Load moves
    async loadMoves() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        console.log('Loading moves...');
        
        try {
            if (this.api && typeof this.api.request === 'function') {
                console.log('Loading moves from API...');
                const response = await this.api.request('GET', '/admin/moves');
                
                if (response && response.success) {
                    this.moves = response.data || [];
                    console.log(`Loaded ${this.moves.length} moves from API`);
                } else {
                    throw new Error(response?.error || 'Failed to load moves from API');
                }
            } else {
                console.log('Loading moves from localStorage...');
                this.moves = JSON.parse(localStorage.getItem('dancify_moves') || '[]');
                console.log(`Loaded ${this.moves.length} moves from localStorage`);
            }
            
            this.renderMoves();
            this.updateMoveStats();
            
        } catch (error) {
            console.error('Failed to load moves:', error);
            this.moves = [];
            this.renderMoves();
        } finally {
            this.isLoading = false;
        }
    }

    // Setup event listeners
    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Wait for DOM elements to be available
        setTimeout(() => {
            this.setupEventListenersAfterDelay();
        }, 1000);
    }

    setupEventListenersAfterDelay() {
        console.log('Attempting to find elements after delay...');
        
        // Count available elements for debugging
        const buttons = document.querySelectorAll('button');
        const inputs = document.querySelectorAll('input');
        const selects = document.querySelectorAll('select');
        
        console.log(`Found ${buttons.length} buttons, ${inputs.length} inputs, ${selects.length} selects`);

        // Create move button
        const createBtn = document.getElementById('createMoveBtn') || 
                         document.querySelector('[onclick*="showCreateMoveModal"]') ||
                         document.querySelector('button[class*="create"]');
        
        if (createBtn) {
            console.log('Found create button via alternative selector');
            createBtn.addEventListener('click', () => this.showCreateMoveModal());
            console.log('Create move button listener added');
        } else {
            console.log('Create move button not found');
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshMovesBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadMoves());
            console.log('Refresh button listener added');
        } else {
            console.log('Refresh button not found');
        }

        // Search input
        const searchInput = document.getElementById('moveSearch');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filterMoves(e.target.value);
                }, 300);
            });
            console.log('Search input listener added');
        } else {
            console.log('Search input not found');
        }

        // Filter dropdowns
        ['danceStyleFilter', 'sectionFilter', 'difficultyFilter'].forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.applyFilters());
                console.log(`${filterId} listener added`);
            } else {
                console.log(`${filterId} not found`);
            }
        });

        // Bulk delete button
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => this.bulkDeleteMoves());
            console.log('Bulk delete button listener added');
        } else {
            console.log('Bulk delete button not found');
        }

        console.log('Event listeners setup complete');
    }

    // Render moves
    renderMoves() {
        let movesContainer = document.getElementById('movesContainer');
        
        if (!movesContainer) {
            console.log('Moves container not found - trying to create one');
            movesContainer = this.createMovesContainer();
        }
        
        if (!movesContainer) {
            console.error('Could not create moves container');
            return;
        }

        if (this.moves.length === 0) {
            movesContainer.innerHTML = `
                <div class="no-data">
                    <div class="no-data-content">
                        <div class="no-data-icon">💃</div>
                        <div class="no-data-text">No moves found</div>
                        <div class="no-data-subtitle">Create your first dance move to get started</div>
                        <button class="btn btn-primary" onclick="window.moveManager.showCreateMoveModal()">
                            Create Move
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const moveCards = this.moves.map(move => this.createMoveCard(move)).join('');
        movesContainer.innerHTML = moveCards;
        
        console.log(`Rendered ${this.moves.length} moves`);
    }

    // Create moves container if it doesn't exist
    createMovesContainer() {
        console.log('Creating moves container');
        
        // Try to find a suitable parent container
        const section = document.getElementById('move-management') || 
                       document.querySelector('.content-container') ||
                       document.querySelector('.main-content');
        
        if (!section) {
            console.error('No suitable parent found for moves container');
            return null;
        }

        const container = document.createElement('div');
        container.id = 'movesContainer';
        container.className = 'moves-grid';
        container.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
            margin-top: 20px;
            padding: 20px;
        `;
        
        section.appendChild(container);
        console.log('Created moves container');
        
        return container;
    }

    // Create move card
    createMoveCard(move) {
        const difficulty = move.difficulty || 'beginner';
        const danceStyle = move.dance_style || move.danceStyle || 'Unknown';
        
        return `
            <div class="move-card" data-move-id="${move.id}">
                <div class="move-header">
                    <h3 class="move-name">${move.name}</h3>
                    <div class="move-badges">
                        <span class="badge badge-${difficulty}">${difficulty}</span>
                        <span class="badge badge-style">${danceStyle}</span>
                    </div>
                </div>
                
                <div class="move-content">
                    <p class="move-description">${move.description || 'No description'}</p>
                    
                    ${move.video_url ? `
                        <div class="move-video">
                            <a href="${move.video_url}" target="_blank" class="video-link">
                                📹 Watch Video
                            </a>
                        </div>
                    ` : ''}
                    
                    <div class="move-meta">
                        <div class="meta-item">
                            <span class="meta-label">Section:</span>
                            <span class="meta-value">${move.section || 'Basic'}</span>
                        </div>
                        ${move.subsection ? `
                            <div class="meta-item">
                                <span class="meta-label">Subsection:</span>
                                <span class="meta-value">${move.subsection}</span>
                            </div>
                        ` : ''}
                        <div class="meta-item">
                            <span class="meta-label">XP Reward:</span>
                            <span class="meta-value">${move.xp_reward || move.xpReward || 50}</span>
                        </div>
                    </div>
                </div>
                
                <div class="move-actions">
                    <button class="btn btn-sm btn-outline" onclick="window.moveManager.editMove('${move.id}')">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.moveManager.deleteMove('${move.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    // Update move statistics
    updateMoveStats() {
        try {
            const totalMovesEl = document.getElementById('totalMoves');
            const activeMoves = this.moves.filter(move => move.is_active !== false);
            
            if (totalMovesEl) {
                totalMovesEl.textContent = activeMoves.length;
            }

            // Update difficulty breakdown
            const difficultyBreakdown = activeMoves.reduce((acc, move) => {
                const difficulty = move.difficulty || 'beginner';
                acc[difficulty] = (acc[difficulty] || 0) + 1;
                return acc;
            }, {});

            // Update dance style breakdown
            const styleBreakdown = activeMoves.reduce((acc, move) => {
                const style = move.dance_style || move.danceStyle || 'Unknown';
                acc[style] = (acc[style] || 0) + 1;
                return acc;
            }, {});

            // Update average rating if available
            const averageRatingEl = document.getElementById('averageRating');
            if (averageRatingEl) {
                const ratedMoves = activeMoves.filter(move => move.rating && move.rating > 0);
                if (ratedMoves.length > 0) {
                    const avgRating = ratedMoves.reduce((sum, move) => sum + move.rating, 0) / ratedMoves.length;
                    averageRatingEl.textContent = avgRating.toFixed(1);
                } else {
                    averageRatingEl.textContent = '0.0';
                }
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

    // Show move modal with DYNAMIC dance style loading
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
            : `
                <option value="Hip-Hop" ${move?.dance_style === 'Hip-Hop' ? 'selected' : ''}>Hip-Hop</option>
                <option value="Ballet" ${move?.dance_style === 'Ballet' ? 'selected' : ''}>Ballet</option>
                <option value="Contemporary" ${move?.dance_style === 'Contemporary' ? 'selected' : ''}>Contemporary</option>
                <option value="Jazz" ${move?.dance_style === 'Jazz' ? 'selected' : ''}>Jazz</option>
                <option value="Latin" ${move?.dance_style === 'Latin' ? 'selected' : ''}>Latin</option>
                <option value="Breakdance" ${move?.dance_style === 'Breakdance' ? 'selected' : ''}>Breakdance</option>
                <option value="Ballroom" ${move?.dance_style === 'Ballroom' ? 'selected' : ''}>Ballroom</option>
                <option value="Tap" ${move?.dance_style === 'Tap' ? 'selected' : ''}>Tap</option>
              `;

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
                                       value="${move?.xp_reward || move?.xpReward || 50}" placeholder="50">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="videoUrl">Video URL</label>
                            <input type="url" id="videoUrl" name="video_url" 
                                   value="${move?.video_url || move?.videoUrl || ''}" 
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
                                      placeholder="Step-by-step instructions">${move?.detailed_instructions || move?.detailedInstructions || ''}</textarea>
                            <div class="error-message" id="instructionsError"></div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancel
                    </button>
                    <button type="button" class="btn btn-primary" onclick="window.moveManager.saveMoveForm('${isCreateMode ? 'create' : 'edit'}', '${move?.id || ''}')">
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
                this.saveMoveForm(isCreateMode ? 'create' : 'edit', move?.id || '');
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

    // Save move form
    async saveMoveForm(mode, moveId) {
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
                if (this.api && typeof this.api.request === 'function') {
                    response = await this.api.request('POST', '/admin/moves', moveData);
                } else {
                    // Fallback to direct API call
                    const fetchResponse = await fetch('/api/admin/moves', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(moveData)
                    });
                    response = await fetchResponse.json();
                    response.success = fetchResponse.ok;
                }
                
                if (response && response.success) {
                    this.moves.push(response.data);
                    this.showSuccessMessage('Move created successfully');
                } else {
                    throw new Error(response?.error || 'Failed to create move');
                }
            } else {
                if (this.api && typeof this.api.request === 'function') {
                    response = await this.api.request('PUT', `/admin/moves/${moveId}`, moveData);
                } else {
                    // Fallback to direct API call
                    const fetchResponse = await fetch(`/api/admin/moves/${moveId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(moveData)
                    });
                    response = await fetchResponse.json();
                    response.success = fetchResponse.ok;
                }
                
                if (response && response.success) {
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
            let response;
            
            if (this.api && typeof this.api.request === 'function') {
                response = await this.api.request('DELETE', `/admin/moves/${moveId}`);
            } else {
                // Fallback to direct API call
                const fetchResponse = await fetch(`/api/admin/moves/${moveId}`, {
                    method: 'DELETE'
                });
                response = await fetchResponse.json();
                response.success = fetchResponse.ok;
            }
            
            if (response && response.success) {
                this.moves = this.moves.filter(m => m.id !== moveId);
                this.showSuccessMessage('Move deleted successfully');
                this.renderMoves();
                this.updateMoveStats();
            } else {
                throw new Error(response?.error || 'Failed to delete move');
            }
        } catch (error) {
            console.error('Error deleting move:', error);
            this.showErrorMessage('Failed to delete move: ' + error.message);
        }
    }

    // Show success message
    showSuccessMessage(message) {
        console.log('SUCCESS:', message);
        alert(message); // Simple alert for now
    }

    // Show error message
    showErrorMessage(message) {
        console.error('ERROR:', message);
        alert('Error: ' + message); // Simple alert for now
    }

    // Filter and search methods
    filterMoves(searchTerm) {
        // Implementation for filtering moves
        console.log('Filtering moves by:', searchTerm);
    }

    applyFilters() {
        // Implementation for applying filters
        console.log('Applying filters');
    }

    bulkDeleteMoves() {
        // Implementation for bulk delete
        console.log('Bulk delete moves');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Try to get API client from global scope
    const apiClient = window.dancifyAPIClient || window.api || null;
    
    window.moveManager = new MoveManager(apiClient);
    
    // Initialize after a short delay to ensure other components are ready
    setTimeout(() => {
        if (window.moveManager && typeof window.moveManager.init === 'function') {
            window.moveManager.init();
        }
    }, 500);
});

console.log('Move Manager ready');