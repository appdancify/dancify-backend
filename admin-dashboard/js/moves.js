// 💃 Dancify Admin Dashboard - Move Management
// Handles dance move CRUD operations, video management, and move organization
// Complete system for creating, editing, and organizing dance moves

class DancifyMoves {
    constructor() {
        this.api = null;
        this.moves = [];
        this.filteredMoves = [];
        this.currentFilter = {};
        this.isLoading = false;
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.totalItems = 0;
        
        // Form validation rules
        this.validationRules = {
            name: { required: true, minLength: 3, maxLength: 100 },
            description: { required: true, minLength: 10, maxLength: 500 },
            detailedInstructions: { required: true, minLength: 20 },
            danceStyle: { required: true },
            category: { required: true },
            difficulty: { required: true },
            videoUrl: { required: false, pattern: /^https?:\/\/.+/ }
        };
    }

    // 🚀 Initialize move management
    async init() {
        try {
            console.log('🕺 Initializing Move Management...');
            
            this.api = window.dancifyAdmin?.modules?.api;
            if (!this.api) {
                throw new Error('API client not available');
            }
            
            await this.loadMoves();
            this.setupEventListeners();
            this.setupFormValidation();
            
            console.log('✅ Move Management initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize move management:', error);
            this.showErrorState();
        }
    }

    // 📚 Load all moves with filtering and pagination
    async loadMoves(filters = {}, page = 1) {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.showLoadingState();
            
            const params = {
                ...filters,
                page,
                limit: this.itemsPerPage
            };
            
            const response = await this.api.getMoves(params);
            
            if (response.success) {
                this.moves = response.data.moves || [];
                this.totalItems = response.data.total || 0;
                this.currentPage = page;
                this.currentFilter = filters;
                
                this.displayMoves();
                this.updatePagination();
            } else {
                throw new Error(response.message || 'Failed to load moves');
            }
            
        } catch (error) {
            console.error('❌ Failed to load moves:', error);
            this.showErrorMessage('Failed to load dance moves');
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    // 🎨 Display moves in the interface
    displayMoves() {
        const container = document.getElementById('movesContainer');
        if (!container) return;
        
        if (this.moves.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }
        
        container.innerHTML = this.moves.map(move => this.createMoveCard(move)).join('');
        this.attachMoveCardEvents();
    }

    // 🎭 Create move card HTML
    createMoveCard(move) {
        const difficultyColor = this.getDifficultyColor(move.difficulty);
        const thumbnail = move.thumbnailUrl || this.generateThumbnail(move.videoUrl);
        
        return `
            <div class="move-card" data-move-id="${move.id}">
                <div class="move-thumbnail">
                    ${thumbnail ? 
                        `<img src="${thumbnail}" alt="${move.name}" loading="lazy">` :
                        `<div class="thumbnail-placeholder">🎭</div>`
                    }
                    <div class="move-overlay">
                        <button class="btn btn-sm btn-primary" onclick="moveManager.editMove('${move.id}')">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="moveManager.deleteMove('${move.id}')">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
                
                <div class="move-content">
                    <div class="move-header">
                        <h3 class="move-name">${this.escapeHtml(move.name)}</h3>
                        <span class="difficulty-badge" style="background-color: ${difficultyColor}">
                            ${move.difficulty}
                        </span>
                    </div>
                    
                    <div class="move-meta">
                        <span class="dance-style">🎭 ${move.danceStyle}</span>
                        <span class="category">📂 ${move.category}</span>
                        ${move.subcategory ? `<span class="subcategory">📁 ${move.subcategory}</span>` : ''}
                    </div>
                    
                    <p class="move-description">${this.escapeHtml(this.truncateText(move.description, 100))}</p>
                    
                    <div class="move-stats">
                        <span class="stat">
                            <span class="stat-icon">👁️</span>
                            <span class="stat-value">${move.viewCount || 0}</span>
                        </span>
                        <span class="stat">
                            <span class="stat-icon">❤️</span>
                            <span class="stat-value">${move.likeCount || 0}</span>
                        </span>
                        <span class="stat">
                            <span class="stat-icon">📅</span>
                            <span class="stat-value">${this.formatDate(move.createdAt)}</span>
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    // 🎨 Get difficulty color
    getDifficultyColor(difficulty) {
        const colors = {
            'beginner': '#28A745',
            'intermediate': '#FFC107',
            'advanced': '#FF6B35',
            'expert': '#DC3545'
        };
        return colors[difficulty?.toLowerCase()] || '#6C757D';
    }

    // 📱 Generate thumbnail for video URLs
    generateThumbnail(videoUrl) {
        if (!videoUrl) return null;
        
        // YouTube thumbnail
        const youtubeId = window.APIUtils?.extractYouTubeID(videoUrl);
        if (youtubeId) {
            return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
        }
        
        return null;
    }

    // 🎯 Attach event listeners to move cards
    attachMoveCardEvents() {
        const moveCards = document.querySelectorAll('.move-card');
        moveCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const moveId = card.dataset.moveId;
                    this.viewMoveDetails(moveId);
                }
            });
        });
    }

    // 📝 Show create move modal
    showCreateMoveModal() {
        const modal = this.createMoveModal();
        document.body.appendChild(modal);
        modal.classList.add('show');
        this.populateFormDropdowns();
    }

    // ✏️ Edit existing move
    async editMove(moveId) {
        try {
            const response = await this.api.getMove(moveId);
            if (response.success) {
                const modal = this.createMoveModal(response.data);
                document.body.appendChild(modal);
                modal.classList.add('show');
                this.populateFormDropdowns(response.data);
            }
        } catch (error) {
            console.error('❌ Failed to load move:', error);
            this.showErrorMessage('Failed to load move details');
        }
    }

    // 🗑️ Delete move
    async deleteMove(moveId) {
        if (!confirm('Are you sure you want to delete this move? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await this.api.deleteMove(moveId);
            if (response.success) {
                this.showNotification('Move deleted successfully', 'success');
                await this.loadMoves(this.currentFilter, this.currentPage);
            } else {
                throw new Error(response.message || 'Failed to delete move');
            }
        } catch (error) {
            console.error('❌ Failed to delete move:', error);
            this.showErrorMessage('Failed to delete move');
        }
    }

    // 🎭 Create move modal HTML
    createMoveModal(moveData = null) {
        const isEdit = moveData !== null;
        const modalId = 'move-modal';
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = modalId;
        
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h2 class="modal-title">${isEdit ? '✏️ Edit Move' : '➕ Create New Move'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                
                <div class="modal-body">
                    <form id="moveForm" class="move-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label required">Move Name</label>
                                <input type="text" class="form-control" name="name" 
                                       value="${isEdit ? this.escapeHtml(moveData.name) : ''}"
                                       placeholder="e.g., Pirouette Basic" required>
                                <div class="form-error" id="name-error"></div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label required">Dance Style</label>
                                <select class="form-control form-select" name="danceStyle" required>
                                    <option value="">Select dance style...</option>
                                </select>
                                <div class="form-error" id="danceStyle-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label required">Category</label>
                                <select class="form-control form-select" name="category" required>
                                    <option value="">Select category...</option>
                                </select>
                                <div class="form-error" id="category-error"></div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Subcategory</label>
                                <select class="form-control form-select" name="subcategory">
                                    <option value="">Select subcategory...</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label required">Difficulty</label>
                                <select class="form-control form-select" name="difficulty" required>
                                    <option value="">Select difficulty...</option>
                                    <option value="beginner" ${isEdit && moveData.difficulty === 'beginner' ? 'selected' : ''}>Beginner</option>
                                    <option value="intermediate" ${isEdit && moveData.difficulty === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                                    <option value="advanced" ${isEdit && moveData.difficulty === 'advanced' ? 'selected' : ''}>Advanced</option>
                                    <option value="expert" ${isEdit && moveData.difficulty === 'expert' ? 'selected' : ''}>Expert</option>
                                </select>
                                <div class="form-error" id="difficulty-error"></div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label required">Description</label>
                            <textarea class="form-control form-textarea" name="description" 
                                      placeholder="Brief description of the move..." required>${isEdit ? this.escapeHtml(moveData.description) : ''}</textarea>
                            <div class="form-error" id="description-error"></div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label required">Detailed Instructions</label>
                            <textarea class="form-control form-textarea" name="detailedInstructions" 
                                      style="min-height: 120px;"
                                      placeholder="Step-by-step instructions for performing this move..." required>${isEdit ? this.escapeHtml(moveData.detailedInstructions) : ''}</textarea>
                            <div class="form-error" id="detailedInstructions-error"></div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Video URL</label>
                            <input type="url" class="form-control" name="videoUrl" 
                                   value="${isEdit ? this.escapeHtml(moveData.videoUrl || '') : ''}"
                                   placeholder="https://youtube.com/watch?v=...">
                            <div class="form-help">YouTube, Vimeo, or direct video URL</div>
                            <div class="form-error" id="videoUrl-error"></div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Duration (seconds)</label>
                                <input type="number" class="form-control" name="duration" min="1" max="3600"
                                       value="${isEdit ? moveData.duration || '' : ''}"
                                       placeholder="e.g., 30">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Level Required</label>
                                <input type="number" class="form-control" name="levelRequired" min="1" max="100"
                                       value="${isEdit ? moveData.levelRequired || '' : ''}"
                                       placeholder="e.g., 5">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Tags</label>
                            <input type="text" class="form-control" name="tags" 
                                   value="${isEdit ? (moveData.tags || []).join(', ') : ''}"
                                   placeholder="spin, balance, beginner-friendly (comma separated)">
                            <div class="form-help">Add tags to help users find this move</div>
                        </div>
                        
                        ${isEdit ? `<input type="hidden" name="id" value="${moveData.id}">` : ''}
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancel
                    </button>
                    <button class="btn btn-primary" onclick="moveManager.saveMoveForm()">
                        ${isEdit ? '💾 Update Move' : '✨ Create Move'}
                    </button>
                </div>
            </div>
        `;
        
        return modal;
    }

    // 📋 Populate form dropdowns
    async populateFormDropdowns(moveData = null) {
        try {
            // Load dance styles
            const stylesResponse = await this.api.getDanceStyles();
            if (stylesResponse.success) {
                this.populateSelect('danceStyle', stylesResponse.data, moveData?.danceStyle);
            }
            
            // Setup cascade for categories
            this.setupCategoryDropdown(moveData);
            
        } catch (error) {
            console.error('❌ Failed to populate dropdowns:', error);
        }
    }

    // 🔗 Setup category dropdown cascade
    setupCategoryDropdown(moveData = null) {
        const danceStyleSelect = document.querySelector('[name="danceStyle"]');
        const categorySelect = document.querySelector('[name="category"]');
        const subcategorySelect = document.querySelector('[name="subcategory"]');
        
        if (!danceStyleSelect || !categorySelect) return;
        
        danceStyleSelect.addEventListener('change', async () => {
            const selectedStyle = danceStyleSelect.value;
            
            // Reset dependent dropdowns
            categorySelect.innerHTML = '<option value="">Select category...</option>';
            subcategorySelect.innerHTML = '<option value="">Select subcategory...</option>';
            
            if (selectedStyle) {
                try {
                    const categoriesResponse = await this.api.getCategories(selectedStyle);
                    if (categoriesResponse.success) {
                        this.populateSelect('category', categoriesResponse.data);
                    }
                } catch (error) {
                    console.error('❌ Failed to load categories:', error);
                }
            }
        });
        
        categorySelect.addEventListener('change', async () => {
            const selectedStyle = danceStyleSelect.value;
            const selectedCategory = categorySelect.value;
            
            subcategorySelect.innerHTML = '<option value="">Select subcategory...</option>';
            
            if (selectedStyle && selectedCategory) {
                try {
                    const subcategoriesResponse = await this.api.getSubcategories(selectedStyle, selectedCategory);
                    if (subcategoriesResponse.success) {
                        this.populateSelect('subcategory', subcategoriesResponse.data);
                    }
                } catch (error) {
                    console.error('❌ Failed to load subcategories:', error);
                }
            }
        });
        
        // Pre-populate if editing
        if (moveData) {
            setTimeout(() => {
                if (moveData.danceStyle) {
                    danceStyleSelect.value = moveData.danceStyle;
                    danceStyleSelect.dispatchEvent(new Event('change'));
                    
                    setTimeout(() => {
                        if (moveData.category) {
                            categorySelect.value = moveData.category;
                            categorySelect.dispatchEvent(new Event('change'));
                            
                            setTimeout(() => {
                                if (moveData.subcategory) {
                                    subcategorySelect.value = moveData.subcategory;
                                }
                            }, 500);
                        }
                    }, 500);
                }
            }, 100);
        }
    }

    // 📝 Populate select dropdown
    populateSelect(selectName, options, selectedValue = null) {
        const select = document.querySelector(`[name="${selectName}"]`);
        if (!select) return;
        
        // Keep the first option (placeholder)
        const placeholder = select.children[0];
        select.innerHTML = '';
        select.appendChild(placeholder);
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value || option.name || option;
            optionElement.textContent = option.label || option.name || option;
            
            if (selectedValue && optionElement.value === selectedValue) {
                optionElement.selected = true;
            }
            
            select.appendChild(optionElement);
        });
    }

    // 💾 Save move form
    async saveMoveForm() {
        const form = document.getElementById('moveForm');
        if (!form) return;
        
        try {
            // Validate form
            const formData = new FormData(form);
            const moveData = Object.fromEntries(formData.entries());
            
            const validation = this.validateMoveData(moveData);
            if (!validation.isValid) {
                this.displayValidationErrors(validation.errors);
                return;
            }
            
            // Process tags
            if (moveData.tags) {
                moveData.tags = moveData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            }
            
            // Convert numeric fields
            if (moveData.duration) moveData.duration = parseInt(moveData.duration);
            if (moveData.levelRequired) moveData.levelRequired = parseInt(moveData.levelRequired);
            
            // Save move
            const isEdit = !!moveData.id;
            const response = isEdit ? 
                await this.api.updateMove(moveData.id, moveData) :
                await this.api.createMove(moveData);
            
            if (response.success) {
                this.showNotification(
                    isEdit ? 'Move updated successfully' : 'Move created successfully', 
                    'success'
                );
                
                // Close modal and refresh
                document.getElementById('move-modal').remove();
                await this.loadMoves(this.currentFilter, this.currentPage);
            } else {
                throw new Error(response.message || 'Failed to save move');
            }
            
        } catch (error) {
            console.error('❌ Failed to save move:', error);
            this.showErrorMessage('Failed to save move');
        }
    }

    // ✅ Validate move data
    validateMoveData(data) {
        const errors = {};
        let isValid = true;
        
        Object.entries(this.validationRules).forEach(([field, rules]) => {
            const value = data[field];
            
            if (rules.required && (!value || value.trim() === '')) {
                errors[field] = 'This field is required';
                isValid = false;
            } else if (value && value.trim() !== '') {
                if (rules.minLength && value.length < rules.minLength) {
                    errors[field] = `Minimum ${rules.minLength} characters required`;
                    isValid = false;
                }
                
                if (rules.maxLength && value.length > rules.maxLength) {
                    errors[field] = `Maximum ${rules.maxLength} characters allowed`;
                    isValid = false;
                }
                
                if (rules.pattern && !rules.pattern.test(value)) {
                    errors[field] = 'Invalid format';
                    isValid = false;
                }
            }
        });
        
        return { isValid, errors };
    }

    // ❌ Display validation errors
    displayValidationErrors(errors) {
        // Clear previous errors
        document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
        
        // Display new errors
        Object.entries(errors).forEach(([field, message]) => {
            const errorElement = document.getElementById(`${field}-error`);
            const inputElement = document.querySelector(`[name="${field}"]`);
            
            if (errorElement) {
                errorElement.textContent = message;
            }
            
            if (inputElement) {
                inputElement.classList.add('error');
            }
        });
    }

    // 🔍 Setup search and filters
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('moveSearch');
        if (searchInput) {
            searchInput.addEventListener('input', 
                this.debounce(() => this.performSearch(), 300)
            );
        }
        
        // Filter dropdowns
        const filterElements = [
            'danceStyleFilter',
            'categoryFilter', 
            'difficultyFilter'
        ];
        
        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.applyFilters());
            }
        });
        
        // Create button
        const createButton = document.querySelector('[data-action="create-move"]');
        if (createButton) {
            createButton.addEventListener('click', () => this.showCreateMoveModal());
        }
    }

    // 🔍 Perform search
    async performSearch() {
        const searchInput = document.getElementById('moveSearch');
        const query = searchInput?.value?.trim() || '';
        
        const filters = { ...this.currentFilter };
        if (query) {
            filters.search = query;
        } else {
            delete filters.search;
        }
        
        await this.loadMoves(filters, 1);
    }

    // 🎯 Apply filters
    async applyFilters() {
        const filters = {};
        
        // Get filter values
        const danceStyle = document.getElementById('danceStyleFilter')?.value;
        const category = document.getElementById('categoryFilter')?.value;
        const difficulty = document.getElementById('difficultyFilter')?.value;
        
        if (danceStyle) filters.danceStyle = danceStyle;
        if (category) filters.category = category;
        if (difficulty) filters.difficulty = difficulty;
        
        // Keep search query
        const searchInput = document.getElementById('moveSearch');
        const query = searchInput?.value?.trim();
        if (query) filters.search = query;
        
        await this.loadMoves(filters, 1);
    }

    // 📄 Update pagination
    updatePagination() {
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        const paginationContainer = document.getElementById('movesPagination');
        
        if (!paginationContainer || totalPages <= 1) {
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `
                <button class="pagination-item" onclick="moveManager.loadMoves(moveManager.currentFilter, ${this.currentPage - 1})">
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
                        onclick="moveManager.loadMoves(moveManager.currentFilter, ${i})">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <button class="pagination-item" onclick="moveManager.loadMoves(moveManager.currentFilter, ${this.currentPage + 1})">
                    Next →
                </button>
            `;
        }
        
        paginationContainer.innerHTML = paginationHTML;
    }

    // 👁️ View move details
    async viewMoveDetails(moveId) {
        try {
            const response = await this.api.getMove(moveId);
            if (response.success) {
                this.showMoveDetailsModal(response.data);
            }
        } catch (error) {
            console.error('❌ Failed to load move details:', error);
            this.showErrorMessage('Failed to load move details');
        }
    }

    // 🎭 Show move details modal
    showMoveDetailsModal(move) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h2 class="modal-title">🎭 ${this.escapeHtml(move.name)}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                
                <div class="modal-body">
                    <div class="move-details">
                        ${move.videoUrl ? `
                            <div class="video-container">
                                ${this.generateVideoEmbed(move.videoUrl)}
                            </div>
                        ` : ''}
                        
                        <div class="move-info">
                            <div class="info-grid">
                                <div class="info-item">
                                    <strong>Dance Style:</strong> ${move.danceStyle}
                                </div>
                                <div class="info-item">
                                    <strong>Category:</strong> ${move.category}
                                </div>
                                <div class="info-item">
                                    <strong>Difficulty:</strong> 
                                    <span class="difficulty-badge" style="background-color: ${this.getDifficultyColor(move.difficulty)}">
                                        ${move.difficulty}
                                    </span>
                                </div>
                                <div class="info-item">
                                    <strong>Duration:</strong> ${move.duration ? `${move.duration}s` : 'Not specified'}
                                </div>
                            </div>
                            
                            <div class="description-section">
                                <h4>Description</h4>
                                <p>${this.escapeHtml(move.description)}</p>
                            </div>
                            
                            <div class="instructions-section">
                                <h4>Detailed Instructions</h4>
                                <div class="instructions-content">
                                    ${this.formatInstructions(move.detailedInstructions)}
                                </div>
                            </div>
                            
                            ${move.tags && move.tags.length > 0 ? `
                                <div class="tags-section">
                                    <h4>Tags</h4>
                                    <div class="tags">
                                        ${move.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            
                            <div class="stats-section">
                                <h4>Statistics</h4>
                                <div class="stats-grid">
                                    <div class="stat-item">
                                        <span class="stat-icon">👁️</span>
                                        <span class="stat-label">Views</span>
                                        <span class="stat-value">${move.viewCount || 0}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-icon">❤️</span>
                                        <span class="stat-label">Likes</span>
                                        <span class="stat-value">${move.likeCount || 0}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-icon">📚</span>
                                        <span class="stat-label">Attempts</span>
                                        <span class="stat-value">${move.attemptCount || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Close
                    </button>
                    <button class="btn btn-primary" onclick="moveManager.editMove('${move.id}'); this.closest('.modal-overlay').remove();">
                        ✏️ Edit Move
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    // 🎬 Generate video embed
    generateVideoEmbed(videoUrl) {
        const youtubeId = window.APIUtils?.extractYouTubeID(videoUrl);
        if (youtubeId) {
            return `
                <iframe 
                    src="https://www.youtube.com/embed/${youtubeId}" 
                    frameborder="0" 
                    allowfullscreen>
                </iframe>
            `;
        }
        
        return `
            <video controls>
                <source src="${videoUrl}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;
    }

    // 📝 Format instructions with line breaks
    formatInstructions(instructions) {
        return this.escapeHtml(instructions).replace(/\n/g, '<br>');
    }

    // 🔄 Refresh moves
    async refresh() {
        await this.loadMoves(this.currentFilter, this.currentPage);
    }

    // 🎨 UI Helper methods
    getEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">🕺</div>
                <h3>No dance moves found</h3>
                <p>Start by creating your first dance move!</p>
                <button class="btn btn-primary" onclick="moveManager.showCreateMoveModal()">
                    ➕ Create First Move
                </button>
            </div>
        `;
    }

    showLoadingState() {
        const container = document.getElementById('movesContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Loading dance moves...</p>
                </div>
            `;
        }
    }

    hideLoadingState() {
        // Loading state is replaced by displayMoves()
    }

    showErrorState() {
        const container = document.getElementById('movesContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Failed to load moves</h3>
                    <p>Please check your connection and try again.</p>
                    <button class="btn btn-primary" onclick="moveManager.loadMoves()">
                        🔄 Retry
                    </button>
                </div>
            `;
        }
    }

    // 🔧 Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showNotification(message, type = 'info') {
        if (window.dancifyAdmin) {
            window.dancifyAdmin.showNotification(message, type);
        }
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    // 🧹 Cleanup
    cleanup() {
        // Remove event listeners and clear data
        this.moves = [];
        this.filteredMoves = [];
        this.currentFilter = {};
        console.log('🧹 Move management cleanup completed');
    }
}

// 🌐 Export for global use
window.DancifyMoves = DancifyMoves;

// Create global instance
window.moveManager = new DancifyMoves();

console.log('🕺 Dancify Move Management loaded');