// Move Management System - Updated Working Version
class MoveManager {
    constructor() {
        this.moves = [];
        this.danceStyles = [];
        this.selectedMoves = new Set();
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
            const requiredElements = ['createMoveBtn', 'movesGrid', 'moveSearchInput'];
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
        
        setTimeout(() => {
            // Create move button - try multiple selectors
            let createMoveBtn = document.getElementById('createMoveBtn');
            if (!createMoveBtn) {
                createMoveBtn = document.querySelector('[onclick*="showCreateMoveModal"], .btn-primary[onclick*="create"]');
            }
            if (!createMoveBtn) {
                createMoveBtn = document.querySelector('.header-actions .btn-primary');
            }
            
            if (createMoveBtn) {
                // Remove existing handlers
                const newBtn = createMoveBtn.cloneNode(true);
                createMoveBtn.parentNode.replaceChild(newBtn, createMoveBtn);
                
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Create button clicked');
                    this.showCreateMoveModal();
                });
                console.log('Create move button listener added');
            } else {
                console.warn('Create move button not found');
            }

            // Refresh button
            const refreshBtn = document.getElementById('refreshMovesBtn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    console.log('Refresh button clicked');
                    this.loadMoves();
                });
                console.log('Refresh button listener added');
            }

            // Search input
            const searchInput = document.getElementById('moveSearchInput');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.currentFilters.search = e.target.value.trim();
                    this.applyFilters();
                });
                console.log('Search input listener added');
            }

            console.log('Event listeners setup complete');
        }, 500);
    }

    // Render moves grid
    renderMoves() {
        let movesContainer = document.getElementById('movesGrid');
        
        if (!movesContainer) {
            const section = document.querySelector('#move-management, .content-section');
            if (section) {
                movesContainer = document.createElement('div');
                movesContainer.id = 'movesGrid';
                movesContainer.className = 'moves-grid';
                movesContainer.style.cssText = `
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                    padding: 20px;
                `;
                section.appendChild(movesContainer);
                console.log('Created moves container');
            }
        }

        if (!movesContainer) {
            console.error('Cannot create moves container');
            return;
        }

        if (!this.moves || this.moves.length === 0) {
            movesContainer.innerHTML = `
                <div class="empty-state" style="
                    text-align: center;
                    padding: 60px 20px;
                    grid-column: 1 / -1;
                ">
                    <div style="font-size: 4rem; margin-bottom: 20px;">💃</div>
                    <h2 style="color: #333; margin-bottom: 10px;">No Dance Moves Found</h2>
                    <p style="color: #666; margin-bottom: 30px;">Create your first dance move to get started</p>
                    <button class="btn btn-primary" onclick="window.moveManager.showCreateMoveModal()" style="
                        background: linear-gradient(135deg, #8A2BE2, #FF69B4);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                    ">
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
        const thumbnailUrl = move.thumbnail_url || 'https://via.placeholder.com/300x200?text=Dance+Move';
        const created = new Date(move.created_at).toLocaleDateString();

        return `
            <div class="move-card" data-move-id="${move.id}" style="
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                overflow: hidden;
                transition: transform 0.2s;
            ">
                <div class="move-thumbnail" style="position: relative;">
                    <img src="${thumbnailUrl}" alt="${move.name}" 
                         style="width: 100%; height: 200px; object-fit: cover;"
                         onerror="this.src='https://via.placeholder.com/300x200?text=Dance+Move'">
                    <div class="move-overlay" style="
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        display: flex;
                        gap: 8px;
                    ">
                        <button onclick="window.moveManager.editMove('${move.id}')" style="
                            background: rgba(0,0,0,0.7);
                            color: white;
                            border: none;
                            padding: 8px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 0.8rem;
                        ">Edit</button>
                        <button onclick="window.moveManager.deleteMove('${move.id}')" style="
                            background: rgba(220,53,69,0.9);
                            color: white;
                            border: none;
                            padding: 8px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 0.8rem;
                        ">Delete</button>
                    </div>
                </div>
                <div class="move-info" style="padding: 20px;">
                    <div class="move-header" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 12px;
                    ">
                        <h3 style="margin: 0; font-size: 1.2rem; color: #333;">${move.name}</h3>
                        <span style="
                            background: ${difficultyColor};
                            color: white;
                            padding: 4px 8px;
                            border-radius: 12px;
                            font-size: 0.75rem;
                            font-weight: 600;
                        ">${move.difficulty}</span>
                    </div>
                    <div class="move-meta" style="
                        display: flex;
                        gap: 12px;
                        margin-bottom: 12px;
                        font-size: 0.9rem;
                        color: #666;
                    ">
                        <span>${move.dance_style}</span>
                        <span>•</span>
                        <span>${move.section}</span>
                    </div>
                    <div class="move-description" style="
                        color: #555;
                        font-size: 0.9rem;
                        line-height: 1.4;
                        margin-bottom: 12px;
                    ">${move.description}</div>
                    <div class="move-stats" style="
                        display: flex;
                        justify-content: space-between;
                        font-size: 0.8rem;
                        color: #888;
                    ">
                        <span>XP: ${move.xp_reward || 50}</span>
                        <span>${created}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Update move statistics
    updateMoveStats() {
        try {
            const totalMovesEl = document.getElementById('totalMoves');
            
            if (totalMovesEl) {
                totalMovesEl.textContent = this.moves.length.toString();
            }
            
            console.log('Move statistics updated');
        } catch (error) {
            console.error('Error updating move statistics:', error);
        }
    }

    // Show create move modal
    showCreateMoveModal() {
        console.log('showCreateMoveModal called');
        this.showMoveModal(null, true);
    }

    // Edit move
    editMove(moveId) {
        console.log('Edit move:', moveId);
        const move = this.moves.find(m => m.id === moveId);
        if (move) {
            this.showMoveModal(move, false);
        } else {
            this.showErrorMessage('Move not found');
        }
    }

    // Show move modal
    showMoveModal(move, isCreateMode) {
        console.log('Creating modal...', isCreateMode ? 'CREATE' : 'EDIT');
        
        // Remove any existing modals
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay show';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modalOverlay.innerHTML = this.createMoveModalHTML(move, isCreateMode);
        document.body.appendChild(modalOverlay);
        
        console.log('Modal created and added to DOM');
        
        setTimeout(() => {
            const firstInput = modalOverlay.querySelector('input, textarea, select');
            if (firstInput) firstInput.focus();
        }, 100);
        
        this.setupMoveModalEvents(modalOverlay, move, isCreateMode);
    }

    // Create move modal HTML with DYNAMIC dance style options
    createMoveModalHTML(move, isCreateMode) {
        // Generate dance style options dynamically
        const danceStyleOptions = this.danceStyles.length > 0 
            ? this.danceStyles.map(style => 
                `<option value="${style.name}" ${move?.dance_style === style.name ? 'selected' : ''}>${style.name}</option>`
              ).join('')
            : '<option value="">No dance styles available - create some first</option>';

        return `
            <div class="modal" style="
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 25px rgba(0,0,0,0.1);
                max-width: 600px;
                width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
            ">
                <div class="modal-header" style="
                    padding: 24px 24px 16px;
                    border-bottom: 1px solid #E9ECEF;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h2 style="margin: 0; color: #333; font-size: 1.5rem;">${isCreateMode ? 'Create New Move' : 'Edit Move'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>
                <div class="modal-body" style="padding: 24px;">
                    <form class="move-form" id="moveForm">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                            <div>
                                <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #333;">Move Name *</label>
                                <input type="text" id="moveName" name="name" required 
                                       value="${move?.name || ''}" placeholder="Enter move name"
                                       style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                                <div id="nameError" style="color: #dc3545; font-size: 12px; margin-top: 4px;"></div>
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #333;">Dance Style *</label>
                                <select id="danceStyle" name="dance_style" required
                                        style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                                    <option value="">Select style</option>
                                    ${danceStyleOptions}
                                </select>
                                <div id="danceStyleError" style="color: #dc3545; font-size: 12px; margin-top: 4px;"></div>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                            <div>
                                <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #333;">Section *</label>
                                <input type="text" id="section" name="section" required 
                                       value="${move?.section || 'Basic Steps'}" placeholder="e.g., Basic Steps"
                                       style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                                <div id="sectionError" style="color: #dc3545; font-size: 12px; margin-top: 4px;"></div>
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #333;">Subsection</label>
                                <input type="text" id="subsection" name="subsection" 
                                       value="${move?.subsection || ''}" placeholder="Optional"
                                       style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                            <div>
                                <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #333;">Difficulty *</label>
                                <select id="difficulty" name="difficulty" required
                                        style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                                    <option value="">Select difficulty</option>
                                    <option value="beginner" ${move?.difficulty === 'beginner' ? 'selected' : ''}>Beginner</option>
                                    <option value="intermediate" ${move?.difficulty === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                                    <option value="advanced" ${move?.difficulty === 'advanced' ? 'selected' : ''}>Advanced</option>
                                    <option value="expert" ${move?.difficulty === 'expert' ? 'selected' : ''}>Expert</option>
                                </select>
                                <div id="difficultyError" style="color: #dc3545; font-size: 12px; margin-top: 4px;"></div>
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #333;">XP Reward</label>
                                <input type="number" id="xpReward" name="xp_reward" min="1" max="1000"
                                       value="${move?.xp_reward || 50}" placeholder="50"
                                       style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #333;">Video URL</label>
                            <input type="url" id="videoUrl" name="video_url" 
                                   value="${move?.video_url || ''}" 
                                   placeholder="https://youtube.com/watch?v=..."
                                   style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #333;">Description *</label>
                            <textarea id="description" name="description" required rows="3"
                                      placeholder="Brief description"
                                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; resize: vertical;">${move?.description || ''}</textarea>
                            <div id="descriptionError" style="color: #dc3545; font-size: 12px; margin-top: 4px;"></div>
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #333;">Detailed Instructions *</label>
                            <textarea id="detailedInstructions" name="detailed_instructions" required rows="5"
                                      placeholder="Step-by-step instructions"
                                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; resize: vertical;">${move?.detailed_instructions || ''}</textarea>
                            <div id="instructionsError" style="color: #dc3545; font-size: 12px; margin-top: 4px;"></div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer" style="
                    padding: 16px 24px 24px;
                    border-top: 1px solid #E9ECEF;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                ">
                    <button type="button" onclick="this.closest('.modal-overlay').remove()" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Cancel</button>
                    <button type="button" onclick="window.moveManager.saveMove('${isCreateMode ? 'create' : 'edit'}', '${move?.id || ''}')" style="
                        background: linear-gradient(135deg, #8A2BE2, #FF69B4);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                    ">${isCreateMode ? 'Create Move' : 'Save Changes'}</button>
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
    }

    // Save move
    async saveMove(mode, moveId) {
        try {
            console.log('Saving move:', mode, moveId);
            
            const form = document.getElementById('moveForm');
            if (!form) throw new Error('Form not found');
            
            // Clear previous errors
            const errorElements = form.querySelectorAll('[id$="Error"]');
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
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10001;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            background-color: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        `;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 4000);
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