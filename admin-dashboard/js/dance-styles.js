// 💃 Dancify Admin Dashboard - Dance Styles Management
// Handles dance style categories, subcategories, and hierarchical organization
// Complete system for managing dance style taxonomy

class DancifyStyles {
    constructor() {
        this.api = null;
        this.danceStyles = [];
        this.categories = {};
        this.subcategories = {};
        this.isLoading = false;
        this.currentExpandedStyle = null;
        
        // Predefined dance styles with metadata
        this.predefinedStyles = [
            {
                name: 'Ballet',
                description: 'Classical dance form with grace and precision',
                color: '#FFB6C1',
                icon: '🩰',
                difficulty: 'intermediate',
                origin: 'France/Italy'
            },
            {
                name: 'Hip-Hop',
                description: 'Urban dance style with rhythm and attitude',
                color: '#FF6B35',
                icon: '🎤',
                difficulty: 'beginner',
                origin: 'United States'
            },
            {
                name: 'Salsa',
                description: 'Passionate Latin dance with partner interaction',
                color: '#FF1493',
                icon: '💃',
                difficulty: 'intermediate',
                origin: 'Cuba/Puerto Rico'
            },
            {
                name: 'Contemporary',
                description: 'Modern expressive dance combining multiple techniques',
                color: '#9370DB',
                icon: '🎭',
                difficulty: 'advanced',
                origin: 'United States'
            },
            {
                name: 'Jazz',
                description: 'Energetic dance style with sharp movements',
                color: '#FFD700',
                icon: '🎺',
                difficulty: 'intermediate',
                origin: 'United States'
            },
            {
                name: 'Breakdancing',
                description: 'Street dance with acrobatic and athletic moves',
                color: '#32CD32',
                icon: '🤸',
                difficulty: 'advanced',
                origin: 'United States'
            },
            {
                name: 'Ballroom',
                description: 'Elegant partner dance for social occasions',
                color: '#DDA0DD',
                icon: '💑',
                difficulty: 'intermediate',
                origin: 'Europe'
            },
            {
                name: 'Latin',
                description: 'Passionate dances from Latin America',
                color: '#FF4500',
                icon: '🌶️',
                difficulty: 'intermediate',
                origin: 'Latin America'
            }
        ];
    }

    // 🚀 Initialize dance styles management
    async init() {
        try {
            console.log('🎭 Initializing Dance Styles Management...');
            
            this.api = window.dancifyAdmin?.modules?.api;
            if (!this.api) {
                throw new Error('API client not available');
            }
            
            await this.loadDanceStyles();
            this.setupEventListeners();
            
            console.log('✅ Dance Styles Management initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize dance styles management:', error);
            this.showErrorState();
        }
    }

    // 📚 Load all dance styles and their categories
    async loadDanceStyles() {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.showLoadingState();
            
            const response = await this.api.getDanceStyles();
            
            if (response.success) {
                this.danceStyles = response.data || [];
                
                // Load categories for each style
                await this.loadAllCategories();
                
                this.displayDanceStyles();
            } else {
                throw new Error(response.message || 'Failed to load dance styles');
            }
            
        } catch (error) {
            console.error('❌ Failed to load dance styles:', error);
            // Fall back to predefined styles for initial setup
            this.danceStyles = this.predefinedStyles.map(style => ({
                ...style,
                id: this.generateId(),
                isActive: true,
                movesCount: 0,
                createdAt: new Date().toISOString()
            }));
            this.displayDanceStyles();
            this.showNotification('Using default dance styles. Create your custom styles below.', 'info');
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    // 📂 Load categories for all dance styles
    async loadAllCategories() {
        for (const style of this.danceStyles) {
            try {
                const categoriesResponse = await this.api.getCategories(style.name);
                if (categoriesResponse.success) {
                    this.categories[style.name] = categoriesResponse.data || [];
                    
                    // Load subcategories for each category
                    for (const category of this.categories[style.name]) {
                        const subcategoriesResponse = await this.api.getSubcategories(style.name, category.name);
                        if (subcategoriesResponse.success) {
                            const key = `${style.name}:${category.name}`;
                            this.subcategories[key] = subcategoriesResponse.data || [];
                        }
                    }
                }
            } catch (error) {
                console.warn(`Failed to load categories for ${style.name}:`, error);
                this.categories[style.name] = [];
            }
        }
    }

    // 🎨 Display dance styles
    displayDanceStyles() {
        const container = document.getElementById('danceStylesContainer');
        if (!container) return;
        
        if (this.danceStyles.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }
        
        container.innerHTML = this.danceStyles.map(style => this.createStyleCard(style)).join('');
        this.attachStyleCardEvents();
    }

    // 🎭 Create dance style card
    createStyleCard(style) {
        const categories = this.categories[style.name] || [];
        const isExpanded = this.currentExpandedStyle === style.id;
        
        return `
            <div class="style-card ${isExpanded ? 'expanded' : ''}" data-style-id="${style.id}">
                <div class="style-header" onclick="styleManager.toggleStyleExpansion('${style.id}')">
                    <div class="style-info">
                        <div class="style-icon" style="background-color: ${style.color}">
                            ${style.icon}
                        </div>
                        <div class="style-details">
                            <h3 class="style-name">${this.escapeHtml(style.name)}</h3>
                            <p class="style-description">${this.escapeHtml(style.description)}</p>
                            <div class="style-meta">
                                <span class="difficulty-badge ${style.difficulty}">
                                    ${style.difficulty}
                                </span>
                                <span class="origin">📍 ${style.origin}</span>
                                <span class="moves-count">🕺 ${style.movesCount || 0} moves</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="style-actions">
                        <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); styleManager.editStyle('${style.id}')">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); styleManager.deleteStyle('${style.id}')">
                            🗑️ Delete
                        </button>
                        <span class="expand-icon">${isExpanded ? '🔽' : '▶️'}</span>
                    </div>
                </div>
                
                ${isExpanded ? `
                    <div class="style-content">
                        <div class="categories-section">
                            <div class="section-header">
                                <h4>📂 Categories</h4>
                                <button class="btn btn-sm btn-primary" onclick="styleManager.showCreateCategoryModal('${style.name}')">
                                    ➕ Add Category
                                </button>
                            </div>
                            
                            <div class="categories-list">
                                ${categories.length > 0 ? 
                                    categories.map(category => this.createCategoryItem(style.name, category)).join('') :
                                    '<div class="empty-categories">No categories yet. Add the first one!</div>'
                                }
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // 📁 Create category item
    createCategoryItem(styleName, category) {
        const subcategories = this.subcategories[`${styleName}:${category.name}`] || [];
        
        return `
            <div class="category-item">
                <div class="category-header">
                    <div class="category-info">
                        <h5 class="category-name">📂 ${this.escapeHtml(category.name)}</h5>
                        <p class="category-description">${this.escapeHtml(category.description || '')}</p>
                        <span class="subcategories-count">${subcategories.length} subcategories</span>
                    </div>
                    
                    <div class="category-actions">
                        <button class="btn btn-sm btn-ghost" onclick="styleManager.editCategory('${styleName}', '${category.id || category.name}')">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="styleManager.showCreateSubcategoryModal('${styleName}', '${category.name}')">
                            ➕ Sub
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="styleManager.deleteCategory('${styleName}', '${category.id || category.name}')">
                            🗑️
                        </button>
                    </div>
                </div>
                
                ${subcategories.length > 0 ? `
                    <div class="subcategories-list">
                        ${subcategories.map(subcategory => `
                            <div class="subcategory-item">
                                <span class="subcategory-name">📁 ${this.escapeHtml(subcategory.name)}</span>
                                <div class="subcategory-actions">
                                    <button class="btn btn-sm btn-ghost" onclick="styleManager.editSubcategory('${styleName}', '${category.name}', '${subcategory.id || subcategory.name}')">
                                        ✏️
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="styleManager.deleteSubcategory('${styleName}', '${category.name}', '${subcategory.id || subcategory.name}')">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // 🔄 Toggle style expansion
    toggleStyleExpansion(styleId) {
        this.currentExpandedStyle = this.currentExpandedStyle === styleId ? null : styleId;
        this.displayDanceStyles();
    }

    // ➕ Show create dance style modal
    showCreateStyleModal() {
        const modal = this.createStyleModal();
        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    // ✏️ Edit dance style
    async editStyle(styleId) {
        const style = this.danceStyles.find(s => s.id === styleId);
        if (!style) return;
        
        const modal = this.createStyleModal(style);
        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    // 🗑️ Delete dance style
    async deleteStyle(styleId) {
        const style = this.danceStyles.find(s => s.id === styleId);
        if (!style) return;
        
        if (!confirm(`Are you sure you want to delete "${style.name}"? This will also delete all its categories and moves.`)) {
            return;
        }
        
        try {
            const response = await this.api.deleteDanceStyle(styleId);
            if (response.success) {
                this.showNotification('Dance style deleted successfully', 'success');
                await this.loadDanceStyles();
            } else {
                throw new Error(response.message || 'Failed to delete dance style');
            }
        } catch (error) {
            console.error('❌ Failed to delete dance style:', error);
            this.showErrorMessage('Failed to delete dance style');
        }
    }

    // 🎭 Create style modal
    createStyleModal(styleData = null) {
        const isEdit = styleData !== null;
        const modalId = 'style-modal';
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = modalId;
        
        modal.innerHTML = `
            <div class="modal modal-md">
                <div class="modal-header">
                    <h2 class="modal-title">${isEdit ? '✏️ Edit Dance Style' : '➕ Create New Dance Style'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                
                <div class="modal-body">
                    <form id="styleForm" class="style-form">
                        <div class="form-group">
                            <label class="form-label required">Style Name</label>
                            <input type="text" class="form-control" name="name" 
                                   value="${isEdit ? this.escapeHtml(styleData.name) : ''}"
                                   placeholder="e.g., Ballet, Hip-Hop, Salsa" required>
                            <div class="form-error" id="name-error"></div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label required">Description</label>
                            <textarea class="form-control form-textarea" name="description" 
                                      placeholder="Brief description of this dance style..." required>${isEdit ? this.escapeHtml(styleData.description) : ''}</textarea>
                            <div class="form-error" id="description-error"></div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Icon</label>
                                <input type="text" class="form-control" name="icon" 
                                       value="${isEdit ? styleData.icon : ''}"
                                       placeholder="🩰" maxlength="2">
                                <div class="form-help">Single emoji to represent this style</div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Color</label>
                                <input type="color" class="form-control" name="color" 
                                       value="${isEdit ? styleData.color : '#FF69B4'}">
                                <div class="form-help">Theme color for this style</div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Difficulty Level</label>
                                <select class="form-control form-select" name="difficulty">
                                    <option value="beginner" ${isEdit && styleData.difficulty === 'beginner' ? 'selected' : ''}>Beginner</option>
                                    <option value="intermediate" ${isEdit && styleData.difficulty === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                                    <option value="advanced" ${isEdit && styleData.difficulty === 'advanced' ? 'selected' : ''}>Advanced</option>
                                    <option value="expert" ${isEdit && styleData.difficulty === 'expert' ? 'selected' : ''}>Expert</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Origin</label>
                                <input type="text" class="form-control" name="origin" 
                                       value="${isEdit ? this.escapeHtml(styleData.origin || '') : ''}"
                                       placeholder="e.g., France, United States">
                            </div>
                        </div>
                        
                        ${isEdit ? `<input type="hidden" name="id" value="${styleData.id}">` : ''}
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancel
                    </button>
                    <button class="btn btn-primary" onclick="styleManager.saveStyleForm()">
                        ${isEdit ? '💾 Update Style' : '✨ Create Style'}
                    </button>
                </div>
            </div>
        `;
        
        return modal;
    }

    // 💾 Save style form
    async saveStyleForm() {
        const form = document.getElementById('styleForm');
        if (!form) return;
        
        try {
            const formData = new FormData(form);
            const styleData = Object.fromEntries(formData.entries());
            
            // Validate required fields
            if (!styleData.name || !styleData.description) {
                this.showErrorMessage('Please fill in all required fields');
                return;
            }
            
            const isEdit = !!styleData.id;
            const response = isEdit ? 
                await this.api.updateDanceStyle(styleData.id, styleData) :
                await this.api.createDanceStyle(styleData);
            
            if (response.success) {
                this.showNotification(
                    isEdit ? 'Dance style updated successfully' : 'Dance style created successfully', 
                    'success'
                );
                
                document.getElementById('style-modal').remove();
                await this.loadDanceStyles();
            } else {
                throw new Error(response.message || 'Failed to save dance style');
            }
            
        } catch (error) {
            console.error('❌ Failed to save dance style:', error);
            this.showErrorMessage('Failed to save dance style');
        }
    }

    // 📂 Category management methods
    showCreateCategoryModal(styleName) {
        const modal = this.createCategoryModal(styleName);
        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    createCategoryModal(styleName, categoryData = null) {
        const isEdit = categoryData !== null;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-md">
                <div class="modal-header">
                    <h2 class="modal-title">${isEdit ? '✏️ Edit Category' : '➕ Add Category'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                
                <div class="modal-body">
                    <form id="categoryForm">
                        <div class="form-group">
                            <label class="form-label">Dance Style</label>
                            <input type="text" class="form-control" value="${styleName}" readonly>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label required">Category Name</label>
                            <input type="text" class="form-control" name="name" 
                                   value="${isEdit ? this.escapeHtml(categoryData.name) : ''}"
                                   placeholder="e.g., Basic Steps, Advanced Techniques" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea class="form-control form-textarea" name="description" 
                                      placeholder="Optional description...">${isEdit ? this.escapeHtml(categoryData.description || '') : ''}</textarea>
                        </div>
                        
                        <input type="hidden" name="styleName" value="${styleName}">
                        ${isEdit ? `<input type="hidden" name="id" value="${categoryData.id || categoryData.name}">` : ''}
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancel
                    </button>
                    <button class="btn btn-primary" onclick="styleManager.saveCategoryForm()">
                        ${isEdit ? '💾 Update' : '✨ Create'}
                    </button>
                </div>
            </div>
        `;
        
        return modal;
    }

    async saveCategoryForm() {
        const form = document.getElementById('categoryForm');
        if (!form) return;
        
        try {
            const formData = new FormData(form);
            const categoryData = Object.fromEntries(formData.entries());
            
            if (!categoryData.name) {
                this.showErrorMessage('Category name is required');
                return;
            }
            
            // For now, we'll add to local state since the API might not have category endpoints yet
            const styleName = categoryData.styleName;
            if (!this.categories[styleName]) {
                this.categories[styleName] = [];
            }
            
            const isEdit = !!categoryData.id;
            if (isEdit) {
                const index = this.categories[styleName].findIndex(c => (c.id || c.name) === categoryData.id);
                if (index !== -1) {
                    this.categories[styleName][index] = {
                        ...this.categories[styleName][index],
                        name: categoryData.name,
                        description: categoryData.description
                    };
                }
            } else {
                this.categories[styleName].push({
                    id: this.generateId(),
                    name: categoryData.name,
                    description: categoryData.description,
                    createdAt: new Date().toISOString()
                });
            }
            
            this.showNotification(
                isEdit ? 'Category updated successfully' : 'Category created successfully', 
                'success'
            );
            
            form.closest('.modal-overlay').remove();
            this.displayDanceStyles();
            
        } catch (error) {
            console.error('❌ Failed to save category:', error);
            this.showErrorMessage('Failed to save category');
        }
    }

    // 📁 Subcategory management
    showCreateSubcategoryModal(styleName, categoryName) {
        const modal = this.createSubcategoryModal(styleName, categoryName);
        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    createSubcategoryModal(styleName, categoryName, subcategoryData = null) {
        const isEdit = subcategoryData !== null;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-md">
                <div class="modal-header">
                    <h2 class="modal-title">${isEdit ? '✏️ Edit Subcategory' : '➕ Add Subcategory'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                
                <div class="modal-body">
                    <form id="subcategoryForm">
                        <div class="form-group">
                            <label class="form-label">Category</label>
                            <input type="text" class="form-control" value="${styleName} → ${categoryName}" readonly>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label required">Subcategory Name</label>
                            <input type="text" class="form-control" name="name" 
                                   value="${isEdit ? this.escapeHtml(subcategoryData.name) : ''}"
                                   placeholder="e.g., Floor Work, Spins, Jumps" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea class="form-control form-textarea" name="description" 
                                      placeholder="Optional description...">${isEdit ? this.escapeHtml(subcategoryData.description || '') : ''}</textarea>
                        </div>
                        
                        <input type="hidden" name="styleName" value="${styleName}">
                        <input type="hidden" name="categoryName" value="${categoryName}">
                        ${isEdit ? `<input type="hidden" name="id" value="${subcategoryData.id || subcategoryData.name}">` : ''}
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancel
                    </button>
                    <button class="btn btn-primary" onclick="styleManager.saveSubcategoryForm()">
                        ${isEdit ? '💾 Update' : '✨ Create'}
                    </button>
                </div>
            </div>
        `;
        
        return modal;
    }

    async saveSubcategoryForm() {
        const form = document.getElementById('subcategoryForm');
        if (!form) return;
        
        try {
            const formData = new FormData(form);
            const subcategoryData = Object.fromEntries(formData.entries());
            
            if (!subcategoryData.name) {
                this.showErrorMessage('Subcategory name is required');
                return;
            }
            
            const key = `${subcategoryData.styleName}:${subcategoryData.categoryName}`;
            if (!this.subcategories[key]) {
                this.subcategories[key] = [];
            }
            
            const isEdit = !!subcategoryData.id;
            if (isEdit) {
                const index = this.subcategories[key].findIndex(s => (s.id || s.name) === subcategoryData.id);
                if (index !== -1) {
                    this.subcategories[key][index] = {
                        ...this.subcategories[key][index],
                        name: subcategoryData.name,
                        description: subcategoryData.description
                    };
                }
            } else {
                this.subcategories[key].push({
                    id: this.generateId(),
                    name: subcategoryData.name,
                    description: subcategoryData.description,
                    createdAt: new Date().toISOString()
                });
            }
            
            this.showNotification(
                isEdit ? 'Subcategory updated successfully' : 'Subcategory created successfully', 
                'success'
            );
            
            form.closest('.modal-overlay').remove();
            this.displayDanceStyles();
            
        } catch (error) {
            console.error('❌ Failed to save subcategory:', error);
            this.showErrorMessage('Failed to save subcategory');
        }
    }

    // 🎯 Setup event listeners
    setupEventListeners() {
        const createButton = document.querySelector('[data-action="create-style"]');
        if (createButton) {
            createButton.addEventListener('click', () => this.showCreateStyleModal());
        }
        
        // Search functionality
        const searchInput = document.getElementById('styleSearch');
        if (searchInput) {
            searchInput.addEventListener('input', 
                this.debounce(() => this.performSearch(), 300)
            );
        }
    }

    attachStyleCardEvents() {
        // Events are attached via onclick attributes in the HTML
    }

    // 🔍 Search functionality
    performSearch() {
        const searchInput = document.getElementById('styleSearch');
        const query = searchInput?.value?.toLowerCase().trim() || '';
        
        if (!query) {
            this.displayDanceStyles();
            return;
        }
        
        const filteredStyles = this.danceStyles.filter(style => 
            style.name.toLowerCase().includes(query) ||
            style.description.toLowerCase().includes(query) ||
            style.origin?.toLowerCase().includes(query)
        );
        
        const container = document.getElementById('danceStylesContainer');
        if (container) {
            if (filteredStyles.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>No dance styles found</h3>
                        <p>No styles match your search criteria.</p>
                    </div>
                `;
            } else {
                container.innerHTML = filteredStyles.map(style => this.createStyleCard(style)).join('');
                this.attachStyleCardEvents();
            }
        }
    }

    // 🔄 Refresh styles
    async refresh() {
        await this.loadDanceStyles();
    }

    // 🎨 UI Helper methods
    getEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">🎭</div>
                <h3>No dance styles found</h3>
                <p>Create your first dance style to get started!</p>
                <button class="btn btn-primary" onclick="styleManager.showCreateStyleModal()">
                    ➕ Create First Style
                </button>
            </div>
        `;
    }

    showLoadingState() {
        const container = document.getElementById('danceStylesContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Loading dance styles...</p>
                </div>
            `;
        }
    }

    hideLoadingState() {
        // Loading state is replaced by displayDanceStyles()
    }

    showErrorState() {
        const container = document.getElementById('danceStylesContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Failed to load dance styles</h3>
                    <p>Please check your connection and try again.</p>
                    <button class="btn btn-primary" onclick="styleManager.loadDanceStyles()">
                        🔄 Retry
                    </button>
                </div>
            `;
        }
    }

    // 🔧 Utility methods
    generateId() {
        return 'style_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
        this.danceStyles = [];
        this.categories = {};
        this.subcategories = {};
        this.currentExpandedStyle = null;
        console.log('🧹 Dance styles management cleanup completed');
    }
}

// 🌐 Export for global use
window.DancifyStyles = DancifyStyles;

// Create global instance
window.styleManager = new DancifyStyles();

console.log('🎭 Dancify Dance Styles Management loaded');