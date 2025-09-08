// 🕺 Move Management System - Complete Implementation
// Handles all move CRUD operations with enhanced validation and UI feedback

class MoveManager {
    constructor() {
        this.moves = [];
        this.selectedMoves = new Set();
        this.currentPage = 1;
        this.movesPerPage = 12;
        this.totalPages = 1;
        this.currentFilters = {};
        this.api = window.api || null;
        
        console.log('🎯 MoveManager initialized');
        this.init();
    }

    // 🚀 Initialize the move management system
    async init() {
        try {
            console.log('🔄 Initializing Move Management...');
            
            // Load moves from API or localStorage
            await this.loadMoves();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initial render
            this.renderMoves();
            this.updateMoveStats();
            
            console.log('✅ Move Management initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Move Management:', error);
            this.showErrorMessage('Failed to initialize move management: ' + error.message);
        }
    }

    // 🔗 Setup event listeners
    setupEventListeners() {
        // Create move button
        const createMoveBtn = document.getElementById('createMoveBtn');
        if (createMoveBtn) {
            createMoveBtn.addEventListener('click', () => this.showCreateMoveModal());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshMovesBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadMoves(1));
        }

        // Search input
        const searchInput = document.getElementById('moveSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value.trim();
                this.applyFilters();
            });
        }

        // Filter dropdowns
        const filterElements = [
            'danceStyleFilter',
            'sectionFilter', 
            'difficultyFilter'
        ];

        filterElements.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.currentFilters[filterId.replace('Filter', '')] = e.target.value;
                    this.applyFilters();
                });
            }
        });

        // Bulk delete button
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => this.bulkDeleteMoves());
        }

        console.log('🔗 Event listeners setup complete');
    }

    // 📥 Load moves from API or localStorage
    async loadMoves(page = 1, filters = {}) {
        try {
            console.log('📥 Loading moves...', { page, filters });
            this.currentPage = page;
            this.currentFilters = filters;

            // Try API first
            if (this.api && typeof this.api.getMoves === 'function') {
                console.log('🌐 Loading moves via API...');
                const response = await this.api.getMoves(page, filters);
                
                if (response && response.success) {
                    this.moves = response.data || [];
                    this.totalPages = response.totalPages || 1;
                    console.log(`✅ Loaded ${this.moves.length} moves via API`);
                } else {
                    throw new Error(response?.error || 'API request failed');
                }
            } else {
                console.log('💾 Loading moves from localStorage...');
                // Load from localStorage for development/demo
                const storedMoves = localStorage.getItem('dancify_moves');
                if (storedMoves) {
                    this.moves = JSON.parse(storedMoves);
                } else {
                    // Initialize with sample data
                    this.moves = this.generateSampleMoves();
                    localStorage.setItem('dancify_moves', JSON.stringify(this.moves));
                }
                console.log(`✅ Loaded ${this.moves.length} moves from localStorage`);
            }

        } catch (error) {
            console.error('❌ Failed to load moves:', error);
            this.showErrorMessage('Failed to load moves: ' + error.message);
            
            // Fallback to sample data
            this.moves = this.generateSampleMoves();
        }
    }

    // 🎲 Generate sample moves for development
    generateSampleMoves() {
        return [
            {
                id: 'move-sample-1',
                name: 'Hip Hop Basic Step',
                description: 'Foundation move for hip hop dancing',
                detailed_instructions: 'Step to the right, bring left foot to meet right, step left, bring right foot to meet left. Add bounce and attitude.',
                dance_style: 'hip-hop',
                section: 'Basic Steps',
                subsection: '',
                difficulty: 'beginner',
                xp_reward: 25,
                video_url: 'https://youtube.com/watch?v=example1',
                thumbnail_url: 'https://img.youtube.com/vi/example1/maxresdefault.jpg',
                view_count: 1250,
                rating: 4.5,
                rating_count: 89,
                is_active: true,
                created_at: '2024-01-15T10:00:00Z',
                updated_at: '2024-01-15T10:00:00Z'
            },
            {
                id: 'move-sample-2',
                name: 'Pirouette',
                description: 'Classic ballet turn on one foot',
                detailed_instructions: 'Start in fourth position, plié, push off back foot, rise to relevé on supporting leg, turn, land in fourth position.',
                dance_style: 'ballet',
                section: 'Turns',
                subsection: 'Single Turns',
                difficulty: 'intermediate',
                xp_reward: 75,
                video_url: '',
                thumbnail_url: 'https://via.placeholder.com/300x200?text=Ballet+Pirouette',
                view_count: 890,
                rating: 4.8,
                rating_count: 45,
                is_active: true,
                created_at: '2024-01-16T14:30:00Z',
                updated_at: '2024-01-16T14:30:00Z'
            }
        ];
    }

    // 🎨 Render moves grid
    renderMoves() {
        const movesContainer = document.getElementById('movesGrid');
        if (!movesContainer) {
            console.error('❌ Moves container not found');
            return;
        }

        if (!this.moves || this.moves.length === 0) {
            movesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🕺</div>
                    <div class="empty-title">No Dance Moves Found</div>
                    <div class="empty-description">Create your first dance move to get started</div>
                    <button class="btn btn-primary" onclick="window.moveManager.showCreateMoveModal()">
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
                            ✏️
                        </button>
                        <button class="btn-icon" onclick="window.moveManager.deleteMove('${move.id}')" title="Delete Move">
                            🗑️
                        </button>
                        <button class="btn-icon" onclick="window.moveManager.toggleMoveSelection('${move.id}')" title="Select Move">
                            ☑️
                        </button>
                    </div>
                    ${move.video_url ? `<div class="play-button">▶️</div>` : ''}
                </div>
                <div class="move-info">
                    <div class="move-header">
                        <h3 class="move-title">${move.name}</h3>
                        <span class="difficulty-badge" style="background-color: ${difficultyColor}; color: white;">
                            ${move.difficulty}
                        </span>
                    </div>
                    <div class="move-meta">
                        <span class="dance-style">💃 ${move.dance_style}</span>
                        <span class="section">📂 ${move.section}</span>
                        ${move.subsection ? `<span class="subsection">📁 ${move.subsection}</span>` : ''}
                    </div>
                    <div class="move-description">${move.description}</div>
                    <div class="move-stats">
                        <span class="views">👁️ ${viewCount.toLocaleString()}</span>
                        <span class="rating">⭐ ${rating.toFixed(1)}</span>
                        <span class="xp">🎯 ${move.xp_reward} XP</span>
                        <span class="created">📅 ${created}</span>
                    </div>
                </div>
            </div>
        `;
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
        } else {
            this.showErrorMessage('Move not found');
        }
    }

    // 🎯 Show move modal (create or edit)
    showMoveModal(move, isCreateMode) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay show';
        modalOverlay.innerHTML = this.createMoveModalHTML(move, isCreateMode);
        
        document.body.appendChild(modalOverlay);
        
        // Focus on first input
        setTimeout(() => {
            const firstInput = modalOverlay.querySelector('input, textarea, select');
            if (firstInput) firstInput.focus();
        }, 100);
        
        // Setup enhanced modal events
        this.setupEnhancedMoveModalEvents(modalOverlay, move);
    }

    // 🎨 Create move modal HTML
    createMoveModalHTML(move, isCreateMode) {
        return `
            <div class="modal">
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
                                    <option value="ballroom" ${move?.dance_style === 'ballroom' ? 'selected' : ''}>Ballroom</option>
                                    <option value="tap" ${move?.dance_style === 'tap' ? 'selected' : ''}>Tap</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="section">Section *</label>
                                <input type="text" id="section" name="section" required 
                                       value="${move?.section || 'Basic Steps'}" placeholder="e.g., Basic Steps, Advanced Combos">
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
                                    <option value="expert" ${move?.difficulty === 'expert' ? 'selected' : ''}>Expert</option>
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
                    <button class="btn btn-primary" onclick="window.moveManager.saveMove(${isCreateMode ? 'null' : `'${move?.id || ''}'`})">
                        💾 ${isCreateMode ? 'Create Move' : 'Save Changes'}
                    </button>
                </div>
            </div>
        `;
    }

    // 🎯 Enhanced modal event setup with real-time validation
    setupEnhancedMoveModalEvents(modal, move) {
        const form = modal.querySelector('#moveForm');
        
        if (form) {
            // Handle form submission
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveMove(move?.id || null);
            });
            
            // Real-time validation for required fields
            const requiredFields = ['moveName', 'moveDescription', 'detailedInstructions', 'danceStyle', 'difficulty'];
            requiredFields.forEach(fieldId => {
                const field = modal.querySelector(`#${fieldId}`);
                if (field) {
                    field.addEventListener('blur', () => this.validateField(field));
                    field.addEventListener('input', () => this.clearFieldError(field));
                }
            });
            
            // Auto-generate section from dance style if not provided
            const danceStyleSelect = modal.querySelector('#danceStyle');
            const sectionInput = modal.querySelector('#section');
            if (danceStyleSelect && sectionInput) {
                danceStyleSelect.addEventListener('change', () => {
                    if (!sectionInput.value.trim()) {
                        sectionInput.value = 'Basic Steps';
                    }
                });
            }
        }
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (confirm('Close without saving? Any changes will be lost.')) {
                    modal.remove();
                }
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.parentNode) {
                if (confirm('Close without saving? Any changes will be lost.')) {
                    modal.remove();
                }
            }
        }, { once: true });
    }

    // 💾 Save move - COMPLETE IMPLEMENTATION with full functionality
    async saveMove(moveId) {
        try {
            // Get form elements and validate they exist
            const nameEl = document.getElementById('moveName');
            const descEl = document.getElementById('moveDescription');
            const instructionsEl = document.getElementById('detailedInstructions');
            const styleEl = document.getElementById('danceStyle');
            const sectionEl = document.getElementById('section');
            const difficultyEl = document.getElementById('difficulty');
            const xpEl = document.getElementById('xpReward');
            const videoEl = document.getElementById('videoUrl');

            if (!nameEl || !descEl || !instructionsEl || !styleEl || !difficultyEl) {
                throw new Error('Form elements not found. Please refresh and try again.');
            }

            // Collect form data
            const moveData = {
                name: nameEl.value.trim(),
                description: descEl.value.trim(),
                detailed_instructions: instructionsEl.value.trim(),
                dance_style: styleEl.value,
                section: sectionEl?.value?.trim() || 'Basic Steps',
                subsection: document.getElementById('subsection')?.value?.trim() || '',
                difficulty: difficultyEl.value,
                xp_reward: parseInt(xpEl?.value) || 50,
                video_url: videoEl?.value?.trim() || ''
            };
            
            // Enhanced validation with specific error messages
            const validationErrors = [];
            if (!moveData.name) validationErrors.push('Move name is required');
            if (!moveData.description) validationErrors.push('Description is required');
            if (!moveData.detailed_instructions) validationErrors.push('Detailed instructions are required');
            if (!moveData.dance_style) validationErrors.push('Dance style must be selected');
            if (!moveData.difficulty) validationErrors.push('Difficulty level must be selected');
            
            if (validationErrors.length > 0) {
                throw new Error('Please fix the following:\n• ' + validationErrors.join('\n• '));
            }
            
            console.log('💾 Saving move:', moveId ? 'UPDATE' : 'CREATE', moveData);
            
            // Show loading state
            const saveButton = document.querySelector('.modal-footer .btn-primary');
            const originalText = saveButton.textContent;
            saveButton.textContent = '⏳ Saving...';
            saveButton.disabled = true;
            
            try {
                // Try API call first
                if (this.api && (moveId ? this.api.updateMove : this.api.createMove)) {
                    const response = moveId ? 
                        await this.api.updateMove(moveId, moveData) :
                        await this.api.createMove(moveData);
                    
                    if (response && response.success) {
                        console.log('✅ Move saved via API');
                        
                        // Update local data with API response
                        if (moveId) {
                            const moveIndex = this.moves.findIndex(m => m.id === moveId);
                            if (moveIndex !== -1) {
                                this.moves[moveIndex] = { ...this.moves[moveIndex], ...moveData, updated_at: new Date().toISOString() };
                            }
                        } else if (response.data) {
                            // Add new move from API response
                            this.moves.push(response.data);
                        }
                    } else {
                        throw new Error(response?.error || 'API save failed');
                    }
                } else {
                    console.warn('⚠️ API not available, saving locally');
                    
                    // Local save implementation for development/demo
                    if (moveId) {
                        // Update existing move
                        const moveIndex = this.moves.findIndex(m => m.id === moveId);
                        if (moveIndex !== -1) {
                            this.moves[moveIndex] = { 
                                ...this.moves[moveIndex], 
                                ...moveData, 
                                updated_at: new Date().toISOString() 
                            };
                            console.log('✅ Move updated locally');
                        } else {
                            throw new Error('Move not found for update');
                        }
                    } else {
                        // Create new move
                        const newMove = {
                            id: `move-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            ...moveData,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            view_count: 0,
                            rating: 0,
                            rating_count: 0,
                            is_active: true,
                            // Generate thumbnail from video URL if provided
                            thumbnail_url: moveData.video_url ? this.generateThumbnailUrl(moveData.video_url) : null
                        };
                        
                        this.moves.unshift(newMove); // Add to beginning of array
                        console.log('✅ New move created locally:', newMove.id);
                    }
                    
                    // Save to localStorage for persistence across page reloads
                    try {
                        localStorage.setItem('dancify_moves', JSON.stringify(this.moves));
                        console.log('💾 Moves saved to localStorage');
                    } catch (storageError) {
                        console.warn('⚠️ Could not save to localStorage:', storageError);
                    }
                }
                
                // Success feedback
                const action = moveId ? 'updated' : 'created';
                this.showSuccessMessage(`Move "${moveData.name}" ${action} successfully! 🎉`);
                
                // Close modal
                const modal = document.querySelector('.modal-overlay');
                if (modal) {
                    modal.remove();
                }
                
                // Refresh the UI
                await this.refreshMovesDisplay();
                
            } finally {
                // Restore button state
                if (saveButton) {
                    saveButton.textContent = originalText;
                    saveButton.disabled = false;
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to save move:', error);
            this.showErrorMessage('Failed to save move: ' + error.message);
            
            // Restore button state on error
            const saveButton = document.querySelector('.modal-footer .btn-primary');
            if (saveButton) {
                saveButton.disabled = false;
                if (saveButton.textContent.includes('⏳')) {
                    saveButton.textContent = saveButton.textContent.replace('⏳ Saving...', moveId ? '💾 Save Changes' : '💾 Create Move');
                }
            }
        }
    }

    // 🔄 Refresh moves display after save
    async refreshMovesDisplay() {
        try {
            // Re-render moves grid
            this.renderMoves();
            
            // Update statistics
            this.updateMoveStats();
            
            // Apply current filters if any
            if (this.currentFilters && Object.keys(this.currentFilters).length > 0) {
                this.applyFilters();
            }
            
            console.log('✅ Moves display refreshed');
        } catch (error) {
            console.error('❌ Error refreshing moves display:', error);
        }
    }

    // 🖼️ Generate thumbnail URL from video URL
    generateThumbnailUrl(videoUrl) {
        if (!videoUrl) return null;
        
        // Extract YouTube video ID
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = videoUrl.match(youtubeRegex);
        
        if (match && match[1]) {
            return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
        }
        
        // Default placeholder
        return 'https://via.placeholder.com/300x200?text=Dance+Move';
    }

    // ✅ Field validation helper
    validateField(field) {
        const value = field.value.trim();
        const isRequired = field.hasAttribute('required');
        
        if (isRequired && !value) {
            this.showFieldError(field, 'This field is required');
            return false;
        }
        
        // Specific validations
        if (field.type === 'url' && value && !this.isValidUrl(value)) {
            this.showFieldError(field, 'Please enter a valid URL');
            return false;
        }
        
        if (field.type === 'number' && value) {
            const num = parseInt(value);
            const min = parseInt(field.getAttribute('min'));
            const max = parseInt(field.getAttribute('max'));
            
            if (min && num < min) {
                this.showFieldError(field, `Value must be at least ${min}`);
                return false;
            }
            if (max && num > max) {
                this.showFieldError(field, `Value must be no more than ${max}`);
                return false;
            }
        }
        
        this.clearFieldError(field);
        return true;
    }

    // ❌ Show field error
    showFieldError(field, message) {
        this.clearFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#dc3545';
        errorDiv.style.fontSize = '0.875rem';
        errorDiv.style.marginTop = '0.25rem';
        
        field.style.borderColor = '#dc3545';
        field.parentNode.appendChild(errorDiv);
    }

    // ✨ Clear field error
    clearFieldError(field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        field.style.borderColor = '';
    }

    // 🔗 URL validation helper
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // 🗑️ Delete move
    async deleteMove(moveId) {
        const move = this.moves.find(m => m.id === moveId);
        if (!move) {
            this.showErrorMessage('Move not found');
            return;
        }
        
        const confirmed = confirm(`Are you sure you want to delete the move "${move.name}"?\n\nThis action cannot be undone.`);
        if (!confirmed) return;
        
        try {
            console.log('🗑️ Deleting move:', moveId);
            
            // Try API call first
            if (this.api && typeof this.api.deleteMove === 'function') {
                const response = await this.api.deleteMove(moveId);
                
                if (response && response.success) {
                    console.log('✅ Move deleted via API');
                } else {
                    throw new Error(response?.error || 'API deletion failed');
                }
            } else {
                console.warn('⚠️ API not available, simulating deletion');
            }
            
            // Remove from local array
            this.moves = this.moves.filter(m => m.id !== moveId);
            this.selectedMoves.delete(moveId);
            
            // Update localStorage
            try {
                localStorage.setItem('dancify_moves', JSON.stringify(this.moves));
            } catch (storageError) {
                console.warn('⚠️ Could not update localStorage:', storageError);
            }
            
            this.showSuccessMessage('Move deleted successfully');
            this.renderMoves();
            this.updateMoveStats();
            this.updateBulkActionButtons();
            
        } catch (error) {
            console.error('❌ Failed to delete move:', error);
            this.showErrorMessage('Failed to delete move: ' + error.message);
        }
    }

    // 📊 Enhanced move statistics calculation
    updateMoveStats() {
        try {
            const totalMovesEl = document.getElementById('totalMoves');
            const difficultyBreakdownEl = document.getElementById('difficultyBreakdown');
            const totalViewsEl = document.getElementById('totalViews');
            const averageRatingEl = document.getElementById('averageRating');
            
            if (!this.moves || this.moves.length === 0) {
                if (totalMovesEl) totalMovesEl.textContent = '0';
                if (difficultyBreakdownEl) difficultyBreakdownEl.textContent = 'No moves';
                if (totalViewsEl) totalViewsEl.textContent = '0';
                if (averageRatingEl) averageRatingEl.textContent = '0.0';
                return;
            }
            
            // Total moves
            if (totalMovesEl) {
                totalMovesEl.textContent = this.moves.length.toLocaleString();
            }
            
            // Difficulty breakdown
            if (difficultyBreakdownEl) {
                const difficulties = {};
                this.moves.forEach(move => {
                    const diff = move.difficulty || 'unknown';
                    difficulties[diff] = (difficulties[diff] || 0) + 1;
                });
                
                const breakdown = Object.entries(difficulties)
                    .map(([diff, count]) => `${diff}: ${count}`)
                    .join(', ');
                difficultyBreakdownEl.textContent = breakdown;
            }
            
            // Total views
            if (totalViewsEl) {
                const totalViews = this.moves.reduce((sum, move) => sum + (move.view_count || 0), 0);
                totalViewsEl.textContent = totalViews.toLocaleString();
            }
            
            // Average rating
            if (averageRatingEl) {
                const ratedMoves = this.moves.filter(move => move.rating && move.rating > 0);
                if (ratedMoves.length > 0) {
                    const avgRating = ratedMoves.reduce((sum, move) => sum + move.rating, 0) / ratedMoves.length;
                    averageRatingEl.textContent = avgRating.toFixed(1);
                } else {
                    averageRatingEl.textContent = '0.0';
                }
            }
            
            console.log('📊 Move statistics updated');
        } catch (error) {
            console.error('❌ Error updating move statistics:', error);
        }
    }

    // 🔍 Apply filters
    applyFilters() {
        let filteredMoves = [...this.moves];
        
        // Search filter
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filteredMoves = filteredMoves.filter(move => 
                move.name.toLowerCase().includes(searchTerm) ||
                move.description.toLowerCase().includes(searchTerm) ||
                move.dance_style.toLowerCase().includes(searchTerm)
            );
        }
        
        // Dance style filter
        if (this.currentFilters.danceStyle) {
            filteredMoves = filteredMoves.filter(move => 
                move.dance_style === this.currentFilters.danceStyle
            );
        }
        
        // Section filter
        if (this.currentFilters.section) {
            filteredMoves = filteredMoves.filter(move => 
                move.section === this.currentFilters.section
            );
        }
        
        // Difficulty filter
        if (this.currentFilters.difficulty) {
            filteredMoves = filteredMoves.filter(move => 
                move.difficulty === this.currentFilters.difficulty
            );
        }
        
        // Temporarily store original moves and use filtered moves for rendering
        const originalMoves = this.moves;
        this.moves = filteredMoves;
        this.renderMoves();
        this.moves = originalMoves;
        
        console.log(`🔍 Applied filters, showing ${filteredMoves.length} of ${originalMoves.length} moves`);
    }

    // ☑️ Toggle move selection
    toggleMoveSelection(moveId) {
        if (this.selectedMoves.has(moveId)) {
            this.selectedMoves.delete(moveId);
        } else {
            this.selectedMoves.add(moveId);
        }
        
        this.updateBulkActionButtons();
        console.log(`☑️ Move ${moveId} ${this.selectedMoves.has(moveId) ? 'selected' : 'deselected'}`);
    }

    // 🎯 Update bulk action buttons
    updateBulkActionButtons() {
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        const hasSelection = this.selectedMoves.size > 0;
        
        if (bulkDeleteBtn) {
            bulkDeleteBtn.disabled = !hasSelection;
            bulkDeleteBtn.textContent = hasSelection ? 
                `🗑️ Delete Selected (${this.selectedMoves.size})` : 
                '🗑️ Delete Selected';
        }
    }

    // 🗑️ Bulk delete moves
    async bulkDeleteMoves() {
        if (this.selectedMoves.size === 0) {
            this.showErrorMessage('No moves selected for deletion');
            return;
        }
        
        const confirmed = confirm(`Are you sure you want to delete ${this.selectedMoves.size} selected moves?\n\nThis action cannot be undone.`);
        if (!confirmed) return;
        
        try {
            const deletePromises = Array.from(this.selectedMoves).map(moveId => this.deleteMove(moveId));
            await Promise.all(deletePromises);
            
            this.selectedMoves.clear();
            this.updateBulkActionButtons();
            this.showSuccessMessage(`Successfully deleted ${deletePromises.length} moves`);
            
        } catch (error) {
            console.error('❌ Bulk delete failed:', error);
            this.showErrorMessage('Failed to delete some moves: ' + error.message);
        }
    }

    // 💬 Show success message
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
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.innerHTML = `
            <span class="message-text">${message}</span>
            <button class="message-close" onclick="this.parentElement.remove()">✕</button>
        `;
        
        // Add styles
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
        
        messageContainer.appendChild(messageDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// 🚀 Initialize the Move Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.moveManager = new MoveManager();
    console.log('🎯 Move Manager ready');
});

// 🔧 Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MoveManager;
}