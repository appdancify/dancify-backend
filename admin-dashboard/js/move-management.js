// 🕺 Move Management System - Clean Error-Free Version
// Enhanced DOM handling, timing fixes, and robust error handling

class MoveManager {
    constructor() {
        this.moves = [];
        this.selectedMoves = new Set();
        this.currentPage = 1;
        this.movesPerPage = 12;
        this.totalPages = 1;
        this.currentFilters = {};
        this.api = window.apiClient || null;
        this.isInitialized = false;
        
        console.log('🎯 MoveManager initialized');
    }

    // 🚀 Initialize the move management system
    async init() {
        try {
            console.log('🔄 Initializing Move Management...');
            
            // Wait for DOM to be ready
            if (!this.waitForDOM()) {
                console.log('⏳ DOM not ready, waiting...');
                await this.waitForDOMReady();
            }
            
            // Load moves from API or localStorage
            await this.loadMoves();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initial render
            this.renderMoves();
            this.updateMoveStats();
            
            this.isInitialized = true;
            console.log('✅ Move Management initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Move Management:', error);
            this.showErrorMessage('Failed to initialize move management: ' + error.message);
        }
    }

    // 🔍 Check if required DOM elements are available
    waitForDOM() {
        const requiredElements = [
            'movesGrid',
            'createMoveBtn', 
            'moveSearchInput'
        ];
        
        return requiredElements.some(id => {
            const element = document.getElementById(id);
            if (element) {
                console.log(`✅ Found required element: ${id}`);
                return true;
            }
            return false;
        });
    }

    // ⏳ Wait for DOM to be ready
    async waitForDOMReady(maxWait = 5000) {
        const startTime = Date.now();
        let foundElements = 0;
        
        while (foundElements < 2 && (Date.now() - startTime) < maxWait) {
            const requiredElements = ['movesGrid', 'createMoveBtn', 'moveSearchInput'];
            foundElements = requiredElements.filter(id => document.getElementById(id) !== null).length;
            
            if (foundElements >= 2) {
                console.log(`✅ Found ${foundElements}/3 required DOM elements`);
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (foundElements === 0) {
            console.warn('⚠️ No required DOM elements found after waiting');
            return false;
        }
        
        console.log(`⚡ Proceeding with partial DOM readiness (${foundElements}/3 elements found)`);
        return true;
    }

    // 🔗 Setup event listeners
    setupEventListeners() {
        console.log('🔗 Setting up event listeners...');
        
        // Remove existing listeners to prevent duplicates
        this.removeEventListeners();
        
        // Wait for elements to be available
        setTimeout(() => {
            console.log('🎯 Attempting to find elements after delay...');
            
            // Debug: Log what elements we can find
            const allButtons = document.querySelectorAll('button');
            const allInputs = document.querySelectorAll('input');
            const allSelects = document.querySelectorAll('select');
            console.log(`🔍 Found ${allButtons.length} buttons, ${allInputs.length} inputs, ${allSelects.length} selects`);
            
            // Create move button
            let createMoveBtn = document.getElementById('createMoveBtn');
            if (!createMoveBtn) {
                createMoveBtn = document.querySelector('.btn[onclick*="create"], button[title*="Create"], .header-actions .btn-primary');
                if (createMoveBtn) {
                    console.log('🔍 Found create button via alternative selector');
                }
            }
            
            if (createMoveBtn) {
                this.createMoveBtnHandler = (e) => {
                    e.preventDefault();
                    this.showCreateMoveModal();
                };
                createMoveBtn.addEventListener('click', this.createMoveBtnHandler);
                console.log('✅ Create move button listener added');
            } else {
                console.warn('⚠️ Create move button not found');
            }

            // Refresh button
            let refreshBtn = document.getElementById('refreshMovesBtn');
            if (refreshBtn) {
                this.refreshBtnHandler = () => this.loadMoves(1);
                refreshBtn.addEventListener('click', this.refreshBtnHandler);
                console.log('✅ Refresh button listener added');
            } else {
                console.warn('⚠️ Refresh button not found');
            }

            // Search input
            let searchInput = document.getElementById('moveSearchInput');
            if (searchInput) {
                this.searchInputHandler = (e) => {
                    this.currentFilters.search = e.target.value.trim();
                    this.applyFilters();
                };
                searchInput.addEventListener('input', this.searchInputHandler);
                console.log('✅ Search input listener added');
            } else {
                console.warn('⚠️ Search input not found');
            }

            // Filter dropdowns
            const filterElements = [
                'danceStyleFilter',
                'sectionFilter', 
                'difficultyFilter'
            ];

            filterElements.forEach(filterId => {
                let element = document.getElementById(filterId);
                if (element) {
                    const handler = (e) => {
                        this.currentFilters[filterId.replace('Filter', '')] = e.target.value;
                        this.applyFilters();
                    };
                    
                    this[`${filterId}Handler`] = handler;
                    element.addEventListener('change', handler);
                    console.log(`✅ ${filterId} listener added`);
                } else {
                    console.warn(`⚠️ ${filterId} not found`);
                }
            });

            // Bulk delete button
            let bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
            if (bulkDeleteBtn) {
                this.bulkDeleteBtnHandler = () => this.bulkDeleteMoves();
                bulkDeleteBtn.addEventListener('click', this.bulkDeleteBtnHandler);
                console.log('✅ Bulk delete button listener added');
            } else {
                console.warn('⚠️ Bulk delete button not found');
            }

            console.log('🔗 Event listeners setup complete');
            
            // Verify at least one critical element was found
            const criticalElements = [createMoveBtn, refreshBtn, searchInput].filter(Boolean);
            if (criticalElements.length === 0) {
                console.error('❌ No critical elements found, event listeners may not work');
                
                // Fallback: add click listener to section
                const section = document.getElementById('move-management');
                if (section) {
                    console.log('🔧 Adding fallback click listener to section');
                    section.addEventListener('click', (e) => {
                        if (e.target.textContent.includes('Create Move') || e.target.textContent.includes('➕')) {
                            console.log('🎯 Fallback create move click detected');
                            this.showCreateMoveModal();
                        }
                    });
                }
            }
            
        }, 300);
    }

    // 🧹 Remove event listeners to prevent duplicates
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

        const filterElements = ['danceStyleFilter', 'sectionFilter', 'difficultyFilter'];
        filterElements.forEach(filterId => {
            const element = document.getElementById(filterId);
            const handler = this[`${filterId}Handler`];
            if (element && handler) {
                element.removeEventListener('change', handler);
            }
        });

        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        if (bulkDeleteBtn && this.bulkDeleteBtnHandler) {
            bulkDeleteBtn.removeEventListener('click', this.bulkDeleteBtnHandler);
        }
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
                
                try {
                    const response = await this.api.getMoves(page, filters);
                    
                    if (response && response.success) {
                        this.moves = response.data || [];
                        this.totalPages = response.totalPages || 1;
                        console.log(`✅ Loaded ${this.moves.length} moves via API`);
                        return;
                    } else {
                        throw new Error(response?.error || 'API request failed');
                    }
                } catch (apiError) {
                    console.warn('⚠️ API failed, falling back to localStorage:', apiError.message);
                }
            }
            
            // Fallback to localStorage
            console.log('💾 Loading moves from localStorage...');
            const storedMoves = localStorage.getItem('dancify_moves');
            if (storedMoves) {
                this.moves = JSON.parse(storedMoves);
            } else {
                this.moves = this.generateSampleMoves();
                localStorage.setItem('dancify_moves', JSON.stringify(this.moves));
            }
            console.log(`✅ Loaded ${this.moves.length} moves from localStorage`);

        } catch (error) {
            console.error('❌ Failed to load moves:', error);
            this.showErrorMessage('Failed to load moves: ' + error.message);
            this.moves = this.generateSampleMoves();
        }
    }

    // 🎲 Generate sample moves for development
    generateSampleMoves() {
        return [
            {
                id: 'move-sample-1',
                name: 'Hip Hop Basic Step',
                description: 'Foundation move for hip hop dancing with rhythm and style',
                detailed_instructions: 'Step to the right, bring left foot to meet right, step left, bring right foot to meet left. Add bounce and attitude.',
                dance_style: 'hip-hop',
                section: 'Basic Steps',
                subsection: 'Foundation',
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
                description: 'Classic ballet turn executed on one foot with grace and control',
                detailed_instructions: 'Start in fourth position, plié deeply, push off back foot while rising to relevé on supporting leg.',
                dance_style: 'ballet',
                section: 'Turns',
                subsection: 'Single Turns',
                difficulty: 'intermediate',
                xp_reward: 75,
                video_url: 'https://youtube.com/watch?v=example2',
                thumbnail_url: 'https://img.youtube.com/vi/example2/maxresdefault.jpg',
                view_count: 890,
                rating: 4.8,
                rating_count: 45,
                is_active: true,
                created_at: '2024-01-16T14:30:00Z',
                updated_at: '2024-01-16T14:30:00Z'
            },
            {
                id: 'move-sample-3',
                name: 'Windmill',
                description: 'Advanced breakdancing power move requiring core strength',
                detailed_instructions: 'Start in freeze position, sweep leg around while spinning on back/shoulders.',
                dance_style: 'breakdance',
                section: 'Power Moves',
                subsection: 'Advanced Power',
                difficulty: 'expert',
                xp_reward: 150,
                video_url: 'https://youtube.com/watch?v=example3',
                thumbnail_url: 'https://img.youtube.com/vi/example3/maxresdefault.jpg',
                view_count: 2340,
                rating: 4.9,
                rating_count: 156,
                is_active: true,
                created_at: '2024-01-17T09:15:00Z',
                updated_at: '2024-01-17T09:15:00Z'
            }
        ];
    }

    // 🎨 Render moves grid
    renderMoves() {
        let movesContainer = document.getElementById('movesGrid');
        if (!movesContainer) {
            movesContainer = document.querySelector('.moves-grid, [id*="moves"], .move-container');
        }
        
        if (!movesContainer) {
            console.warn('❌ Moves container not found - trying to create one');
            
            const parentContainer = document.querySelector('.moves-container, .content-section, #move-management');
            if (parentContainer) {
                movesContainer = document.createElement('div');
                movesContainer.id = 'movesGrid';
                movesContainer.className = 'moves-grid';
                parentContainer.appendChild(movesContainer);
                console.log('✅ Created moves container');
            } else {
                console.error('❌ Cannot find suitable parent for moves container');
                return;
            }
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

    // 📊 Update move statistics
    updateMoveStats() {
        try {
            const findElement = (id, altSelectors = []) => {
                let element = document.getElementById(id);
                if (!element) {
                    for (const selector of altSelectors) {
                        element = document.querySelector(selector);
                        if (element) break;
                    }
                }
                return element;
            };

            const totalMovesEl = findElement('totalMoves', ['[data-stat="total"]']);
            const difficultyBreakdownEl = findElement('difficultyBreakdown', ['[data-stat="difficulty"]']);
            const totalViewsEl = findElement('totalViews', ['[data-stat="views"]']);
            const averageRatingEl = findElement('averageRating', ['[data-stat="rating"]']);
            
            if (!this.moves || this.moves.length === 0) {
                if (totalMovesEl) totalMovesEl.textContent = '0';
                if (difficultyBreakdownEl) difficultyBreakdownEl.textContent = 'No moves';
                if (totalViewsEl) totalViewsEl.textContent = '0';
                if (averageRatingEl) averageRatingEl.textContent = '0.0';
                return;
            }
            
            if (totalMovesEl) {
                totalMovesEl.textContent = this.moves.length.toLocaleString();
            }
            
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
            
            if (totalViewsEl) {
                const totalViews = this.moves.reduce((sum, move) => sum + (move.view_count || 0), 0);
                totalViewsEl.textContent = totalViews.toLocaleString();
            }
            
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

    // 🎯 Show move modal
    showMoveModal(move, isCreateMode) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay show';
        modalOverlay.innerHTML = this.createMoveModalHTML(move, isCreateMode);
        
        document.body.appendChild(modalOverlay);
        
        setTimeout(() => {
            const firstInput = modalOverlay.querySelector('input, textarea, select');
            if (firstInput) firstInput.focus();
        }, 100);
        
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
                                       value="${move?.section || 'Basic Steps'}" placeholder="e.g., Basic Steps">
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
                                      placeholder="Brief description">${move?.description || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="detailedInstructions">Detailed Instructions *</label>
                            <textarea id="detailedInstructions" name="detailed_instructions" required rows="5" 
                                      placeholder="Step-by-step instructions">${move?.detailed_instructions || ''}</textarea>
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

    // 🎯 Setup modal events
    setupEnhancedMoveModalEvents(modal, move) {
        const form = modal.querySelector('#moveForm');
        
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveMove(move?.id || null);
            });
            
            const requiredFields = ['moveName', 'moveDescription', 'detailedInstructions', 'danceStyle', 'difficulty'];
            requiredFields.forEach(fieldId => {
                const field = modal.querySelector(`#${fieldId}`);
                if (field) {
                    field.addEventListener('blur', () => this.validateField(field));
                    field.addEventListener('input', () => this.clearFieldError(field));
                }
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (confirm('Close without saving? Any changes will be lost.')) {
                    modal.remove();
                }
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.parentNode) {
                if (confirm('Close without saving? Any changes will be lost.')) {
                    modal.remove();
                }
            }
        }, { once: true });
    }

    // 💾 Save move
    async saveMove(moveId) {
        try {
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
            
            const saveButton = document.querySelector('.modal-footer .btn-primary');
            const originalText = saveButton.textContent;
            saveButton.textContent = '⏳ Saving...';
            saveButton.disabled = true;
            
            try {
                if (this.api && (moveId ? this.api.updateMove : this.api.createMove)) {
                    const response = moveId ? 
                        await this.api.updateMove(moveId, moveData) :
                        await this.api.createMove(moveData);
                    
                    if (response && response.success) {
                        console.log('✅ Move saved via API');
                        
                        if (moveId) {
                            const moveIndex = this.moves.findIndex(m => m.id === moveId);
                            if (moveIndex !== -1) {
                                this.moves[moveIndex] = { ...this.moves[moveIndex], ...moveData, updated_at: new Date().toISOString() };
                            }
                        } else if (response.data) {
                            this.moves.push(response.data);
                        }
                    } else {
                        throw new Error(response?.error || 'API save failed');
                    }
                } else {
                    console.warn('⚠️ API not available, saving locally');
                    
                    if (moveId) {
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
                        const newMove = {
                            id: `move-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            ...moveData,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            view_count: 0,
                            rating: 0,
                            rating_count: 0,
                            is_active: true,
                            thumbnail_url: moveData.video_url ? this.generateThumbnailUrl(moveData.video_url) : null
                        };
                        
                        this.moves.unshift(newMove);
                        console.log('✅ New move created locally:', newMove.id);
                    }
                    
                    try {
                        localStorage.setItem('dancify_moves', JSON.stringify(this.moves));
                        console.log('💾 Moves saved to localStorage');
                    } catch (storageError) {
                        console.warn('⚠️ Could not save to localStorage:', storageError);
                    }
                }
                
                const action = moveId ? 'updated' : 'created';
                this.showSuccessMessage(`Move "${moveData.name}" ${action} successfully! 🎉`);
                
                const modal = document.querySelector('.modal-overlay');
                if (modal) {
                    modal.remove();
                }
                
                await this.refreshMovesDisplay();
                
            } finally {
                if (saveButton) {
                    saveButton.textContent = originalText;
                    saveButton.disabled = false;
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to save move:', error);
            this.showErrorMessage('Failed to save move: ' + error.message);
            
            const saveButton = document.querySelector('.modal-footer .btn-primary');
            if (saveButton) {
                saveButton.disabled = false;
                if (saveButton.textContent.includes('⏳')) {
                    saveButton.textContent = saveButton.textContent.replace('⏳ Saving...', moveId ? '💾 Save Changes' : '💾 Create Move');
                }
            }
        }
    }

    // Helper methods
    async refreshMovesDisplay() {
        try {
            this.renderMoves();
            this.updateMoveStats();
            if (this.currentFilters && Object.keys(this.currentFilters).length > 0) {
                this.applyFilters();
            }
            console.log('✅ Moves display refreshed');
        } catch (error) {
            console.error('❌ Error refreshing moves display:', error);
        }
    }

    generateThumbnailUrl(videoUrl) {
        if (!videoUrl) return null;
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = videoUrl.match(youtubeRegex);
        if (match && match[1]) {
            return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
        }
        return 'https://via.placeholder.com/300x200?text=Dance+Move';
    }

    validateField(field) {
        const value = field.value.trim();
        const isRequired = field.hasAttribute('required');
        
        if (isRequired && !value) {
            this.showFieldError(field, 'This field is required');
            return false;
        }
        
        this.clearFieldError(field);
        return true;
    }

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

    clearFieldError(field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        field.style.borderColor = '';
    }

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
        
        if (this.currentFilters.danceStyle) {
            filteredMoves = filteredMoves.filter(move => 
                move.dance_style === this.currentFilters.danceStyle
            );
        }
        
        if (this.currentFilters.section) {
            filteredMoves = filteredMoves.filter(move => 
                move.section === this.currentFilters.section
            );
        }
        
        if (this.currentFilters.difficulty) {
            filteredMoves = filteredMoves.filter(move => 
                move.difficulty === this.currentFilters.difficulty
            );
        }
        
        const originalMoves = this.moves;
        this.moves = filteredMoves;
        this.renderMoves();
        this.moves = originalMoves;
        
        console.log(`🔍 Applied filters, showing ${filteredMoves.length} of ${originalMoves.length} moves`);
    }

    async deleteMove(moveId) {
        const move = this.moves.find(m => m.id === moveId);
        if (!move) {
            this.showErrorMessage('Move not found');
            return;
        }
        
        const confirmed = confirm(`Are you sure you want to delete "${move.name}"?`);
        if (!confirmed) return;
        
        try {
            if (this.api && typeof this.api.deleteMove === 'function') {
                const response = await this.api.deleteMove(moveId);
                if (response && response.success) {
                    console.log('✅ Move deleted via API');
                }
            }
            
            this.moves = this.moves.filter(m => m.id !== moveId);
            this.selectedMoves.delete(moveId);
            
            try {
                localStorage.setItem('dancify_moves', JSON.stringify(this.moves));
            } catch (storageError) {
                console.warn('⚠️ Could not update localStorage:', storageError);
            }
            
            this.showSuccessMessage('Move deleted successfully');
            this.renderMoves();
            this.updateMoveStats();
            
        } catch (error) {
            console.error('❌ Failed to delete move:', error);
            this.showErrorMessage('Failed to delete move: ' + error.message);
        }
    }

    toggleMoveSelection(moveId) {
        if (this.selectedMoves.has(moveId)) {
            this.selectedMoves.delete(moveId);
        } else {
            this.selectedMoves.add(moveId);
        }
    }

    async bulkDeleteMoves() {
        if (this.selectedMoves.size === 0) {
            this.showErrorMessage('No moves selected for deletion');
            return;
        }
        
        const confirmed = confirm(`Delete ${this.selectedMoves.size} selected moves?`);
        if (!confirmed) return;
        
        try {
            const deletePromises = Array.from(this.selectedMoves).map(moveId => this.deleteMove(moveId));
            await Promise.all(deletePromises);
            
            this.selectedMoves.clear();
            this.showSuccessMessage(`Successfully deleted ${deletePromises.length} moves`);
            
        } catch (error) {
            console.error('❌ Bulk delete failed:', error);
            this.showErrorMessage('Failed to delete some moves: ' + error.message);
        }
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('messageContainer') || document.body;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.innerHTML = `
            <span class="message-text">${message}</span>
            <button class="message-close" onclick="this.parentElement.remove()">✕</button>
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
        
        messageContainer.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// 🚀 Initialize the Move Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!window.moveManager) {
        window.moveManager = new MoveManager();
        window.moveManager.init();
        console.log('🎯 Move Manager ready');
    }
});

// Export for global use
window.MoveManager = MoveManager;