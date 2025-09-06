// 💃 Dancify Admin Dashboard - User Management
// Real-time user data management with backend integration

class UserManager {
    constructor(apiClient) {
        this.api = apiClient;
        this.users = [];
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalUsers = 0;
        this.currentFilters = {};
        this.selectedUsers = new Set();
        
        console.log('👥 User Manager initialized');
    }

    // 🚀 Initialize user management
    async init() {
        try {
            console.log('👥 Initializing User Management...');
            
            // Load initial user data
            await this.loadUsers();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up real-time updates
            this.setupRealTimeUpdates();
            
            console.log('✅ User Management initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize User Management:', error);
            this.showErrorMessage('Failed to initialize user management: ' + error.message);
        }
    }

    // 📊 Load users from API
    async loadUsers(page = 1, filters = {}) {
        try {
            console.log(`📊 Loading users (page ${page})...`);
            
            this.showLoadingState();
            
            const queryParams = {
                page,
                limit: this.pageSize,
                ...filters
            };
            
            const response = await this.api.getUsers(queryParams);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load users');
            }
            
            this.users = response.data || [];
            this.currentPage = page;
            this.totalUsers = response.pagination?.total || 0;
            this.currentFilters = filters;
            
            this.renderUsers();
            this.renderPagination();
            this.updateUserStats();
            
            this.hideLoadingState();
            
            console.log(`✅ Loaded ${this.users.length} users`);
            
        } catch (error) {
            console.error('❌ Failed to load users:', error);
            this.hideLoadingState();
            this.showErrorMessage('Failed to load users: ' + error.message);
        }
    }

    // 🎨 Render users table
    renderUsers() {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) {
            console.warn('⚠️ Users table body not found');
            return;
        }
        
        if (this.users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data">
                        <div class="no-data-content">
                            <div class="no-data-icon">👥</div>
                            <div class="no-data-text">No users found</div>
                            <div class="no-data-subtitle">Try adjusting your filters</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        const userRows = this.users.map(user => this.createUserRow(user)).join('');
        tableBody.innerHTML = userRows;
        
        // Update select all checkbox
        this.updateSelectAllCheckbox();
    }

    // 👤 Create user table row
    createUserRow(user) {
        const joinedDate = new Date(user.created_at).toLocaleDateString();
        const lastActive = user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never';
        const isSelected = this.selectedUsers.has(user.id);
        
        const statusBadge = this.getUserStatusBadge(user);
        const roleBadge = this.getUserRoleBadge(user.role);
        const avatar = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username)}&background=random`;
        
        return `
            <tr class="user-row ${isSelected ? 'selected' : ''}" data-user-id="${user.id}">
                <td>
                    <input type="checkbox" class="user-checkbox" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="userManager.toggleUserSelection('${user.id}')">
                </td>
                <td>
                    <div class="user-info">
                        <img src="${avatar}" alt="${user.username}" class="user-avatar">
                        <div class="user-details">
                            <div class="user-name">${user.full_name || user.username}</div>
                            <div class="user-email">${user.email || 'No email'}</div>
                        </div>
                    </div>
                </td>
                <td>@${user.username}</td>
                <td>${roleBadge}</td>
                <td>${statusBadge}</td>
                <td>${user.skill_level || 'Unknown'}</td>
                <td>${joinedDate}</td>
                <td>${lastActive}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-ghost" onclick="userManager.viewUser('${user.id}')" title="View Details">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="userManager.editUser('${user.id}')" title="Edit User">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="userManager.deleteUser('${user.id}')" title="Delete User">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // 🏷️ Get user status badge
    getUserStatusBadge(user) {
        if (!user.is_active) {
            return '<span class="badge badge-danger">Inactive</span>';
        }
        if (user.is_verified) {
            return '<span class="badge badge-success">Verified</span>';
        }
        return '<span class="badge badge-warning">Unverified</span>';
    }

    // 🎭 Get user role badge
    getUserRoleBadge(role) {
        const badges = {
            'admin': '<span class="badge badge-primary">👑 Admin</span>',
            'instructor': '<span class="badge badge-info">🎓 Instructor</span>',
            'moderator': '<span class="badge badge-warning">🛡️ Moderator</span>',
            'user': '<span class="badge badge-secondary">👤 User</span>'
        };
        return badges[role] || badges['user'];
    }

    // 📄 Render pagination
    renderPagination() {
        const paginationContainer = document.getElementById('usersPagination');
        if (!paginationContainer) return;
        
        const totalPages = Math.ceil(this.totalUsers / this.pageSize);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `
                <button class="pagination-item" onclick="userManager.loadUsers(${this.currentPage - 1}, userManager.currentFilters)">
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
                        onclick="userManager.loadUsers(${i}, userManager.currentFilters)">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <button class="pagination-item" onclick="userManager.loadUsers(${this.currentPage + 1}, userManager.currentFilters)">
                    Next →
                </button>
            `;
        }
        
        paginationContainer.innerHTML = paginationHTML;
    }

    // 📊 Update user statistics
    updateUserStats() {
        const stats = {
            total: this.totalUsers,
            active: this.users.filter(u => u.is_active).length,
            verified: this.users.filter(u => u.is_verified).length,
            instructors: this.users.filter(u => u.role === 'instructor').length
        };
        
        // Update stat cards
        const totalUsersEl = document.getElementById('totalUsersCount');
        const activeUsersEl = document.getElementById('activeUsersCount');
        const verifiedUsersEl = document.getElementById('verifiedUsersCount');
        const instructorsEl = document.getElementById('instructorsCount');
        
        if (totalUsersEl) totalUsersEl.textContent = stats.total.toLocaleString();
        if (activeUsersEl) activeUsersEl.textContent = stats.active.toLocaleString();
        if (verifiedUsersEl) verifiedUsersEl.textContent = stats.verified.toLocaleString();
        if (instructorsEl) instructorsEl.textContent = stats.instructors.toLocaleString();
    }

    // 🎯 Set up event listeners
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('userSearchInput');
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
        const filterElements = ['userRoleFilter', 'userStatusFilter', 'skillLevelFilter'];
        filterElements.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', () => {
                    this.applyFilters();
                });
            }
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshUsersBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshUsers();
            });
        }

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllUsers');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }
    }

    // 🔄 Set up real-time updates
    setupRealTimeUpdates() {
        // Refresh data every 5 minutes
        setInterval(() => {
            console.log('🔄 Auto-refreshing user data...');
            this.loadUsers(this.currentPage, this.currentFilters);
        }, 5 * 60 * 1000);
    }

    // 🔍 Apply filters
    async applyFilters() {
        const searchInput = document.getElementById('userSearchInput');
        const roleFilter = document.getElementById('userRoleFilter');
        const statusFilter = document.getElementById('userStatusFilter');
        const skillFilter = document.getElementById('skillLevelFilter');

        const filters = {};

        if (searchInput?.value.trim()) {
            filters.search = searchInput.value.trim();
        }
        if (roleFilter?.value) {
            filters.role = roleFilter.value;
        }
        if (statusFilter?.value) {
            if (statusFilter.value === 'active') filters.is_active = true;
            if (statusFilter.value === 'inactive') filters.is_active = false;
            if (statusFilter.value === 'verified') filters.is_verified = true;
        }
        if (skillFilter?.value) {
            filters.skill_level = skillFilter.value;
        }

        await this.loadUsers(1, filters);
    }

    // 🧹 Clear filters
    async clearFilters() {
        document.getElementById('userSearchInput').value = '';
        document.getElementById('userRoleFilter').value = '';
        document.getElementById('userStatusFilter').value = '';
        document.getElementById('skillLevelFilter').value = '';

        await this.loadUsers(1, {});
    }

    // 🔄 Refresh users
    async refreshUsers() {
        console.log('🔄 Refreshing user data...');
        await this.loadUsers(this.currentPage, this.currentFilters);
        this.showSuccessMessage('User data refreshed successfully');
    }

    // ✅ Toggle user selection
    toggleUserSelection(userId) {
        if (this.selectedUsers.has(userId)) {
            this.selectedUsers.delete(userId);
        } else {
            this.selectedUsers.add(userId);
        }
        
        this.updateSelectAllCheckbox();
        this.updateBulkActionButtons();
    }

    // ✅ Toggle select all
    toggleSelectAll(selectAll) {
        this.selectedUsers.clear();
        
        if (selectAll) {
            this.users.forEach(user => {
                this.selectedUsers.add(user.id);
            });
        }
        
        // Update individual checkboxes
        const checkboxes = document.querySelectorAll('.user-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll;
        });
        
        // Update row highlighting
        const rows = document.querySelectorAll('.user-row');
        rows.forEach(row => {
            row.classList.toggle('selected', selectAll);
        });
        
        this.updateBulkActionButtons();
    }

    // 🔄 Update select all checkbox state
    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('selectAllUsers');
        if (!selectAllCheckbox) return;
        
        const totalUsers = this.users.length;
        const selectedCount = this.selectedUsers.size;
        
        if (selectedCount === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (selectedCount === totalUsers) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }

    // 🎯 Update bulk action buttons
    updateBulkActionButtons() {
        const bulkActionContainer = document.getElementById('bulkActionContainer');
        const selectedCount = this.selectedUsers.size;
        
        if (bulkActionContainer) {
            if (selectedCount > 0) {
                bulkActionContainer.style.display = 'block';
                bulkActionContainer.querySelector('.selected-count').textContent = selectedCount;
            } else {
                bulkActionContainer.style.display = 'none';
            }
        }
    }

    // 👁️ View user details
    async viewUser(userId) {
        try {
            const response = await this.api.getUser(userId);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load user');
            }
            
            this.showUserModal(response.data, 'view');
            
        } catch (error) {
            console.error('❌ Failed to load user:', error);
            this.showErrorMessage('Failed to load user details: ' + error.message);
        }
    }

    // ✏️ Edit user
    async editUser(userId) {
        try {
            const response = await this.api.getUser(userId);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load user');
            }
            
            this.showUserModal(response.data, 'edit');
            
        } catch (error) {
            console.error('❌ Failed to load user for editing:', error);
            this.showErrorMessage('Failed to load user for editing: ' + error.message);
        }
    }

    // 🗑️ Delete user
    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        const confirmed = confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`);
        if (!confirmed) return;
        
        try {
            const response = await this.api.deleteUser(userId);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to delete user');
            }
            
            this.showSuccessMessage('User deleted successfully');
            await this.loadUsers(this.currentPage, this.currentFilters);
            
        } catch (error) {
            console.error('❌ Failed to delete user:', error);
            this.showErrorMessage('Failed to delete user: ' + error.message);
        }
    }

    // 📱 Show user modal
    showUserModal(user, mode = 'view') {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = this.createUserModalHTML(user, mode);
        
        document.body.appendChild(modal);
        
        if (mode === 'edit') {
            this.setupUserModalEvents(modal, user);
        }
    }

    // 🎨 Create user modal HTML
    createUserModalHTML(user, mode) {
        const isEditMode = mode === 'edit';
        const avatar = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username)}&background=random`;
        
        return `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h2>${isEditMode ? '✏️ Edit User' : '👁️ User Details'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                
                <div class="modal-body">
                    <div class="user-modal-content">
                        <div class="user-avatar-section">
                            <img src="${avatar}" alt="${user.username}" class="user-modal-avatar">
                            ${isEditMode ? '<button class="btn btn-sm btn-secondary">Change Avatar</button>' : ''}
                        </div>
                        
                        <div class="user-form">
                            <div class="form-group">
                                <label class="form-label">Full Name</label>
                                ${isEditMode ? 
                                    `<input type="text" class="form-control" id="editFullName" value="${user.full_name || ''}" placeholder="Enter full name">` :
                                    `<div class="form-value">${user.full_name || 'Not provided'}</div>`
                                }
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Username</label>
                                ${isEditMode ? 
                                    `<input type="text" class="form-control" id="editUsername" value="${user.username}" placeholder="Enter username">` :
                                    `<div class="form-value">@${user.username}</div>`
                                }
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                ${isEditMode ? 
                                    `<input type="email" class="form-control" id="editEmail" value="${user.email || ''}" placeholder="Enter email">` :
                                    `<div class="form-value">${user.email || 'Not provided'}</div>`
                                }
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Role</label>
                                ${isEditMode ? 
                                    `<select class="form-control" id="editRole">
                                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                                        <option value="instructor" ${user.role === 'instructor' ? 'selected' : ''}>Instructor</option>
                                        <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                                    </select>` :
                                    `<div class="form-value">${this.getUserRoleBadge(user.role)}</div>`
                                }
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Skill Level</label>
                                ${isEditMode ? 
                                    `<select class="form-control" id="editSkillLevel">
                                        <option value="beginner" ${user.skill_level === 'beginner' ? 'selected' : ''}>Beginner</option>
                                        <option value="intermediate" ${user.skill_level === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                                        <option value="advanced" ${user.skill_level === 'advanced' ? 'selected' : ''}>Advanced</option>
                                        <option value="expert" ${user.skill_level === 'expert' ? 'selected' : ''}>Expert</option>
                                    </select>` :
                                    `<div class="form-value">${user.skill_level || 'Not set'}</div>`
                                }
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <div class="form-value">
                                    ${this.getUserStatusBadge(user)}
                                    ${isEditMode ? `
                                        <div class="status-toggles">
                                            <label class="checkbox-label">
                                                <input type="checkbox" id="editIsActive" ${user.is_active ? 'checked' : ''}>
                                                Active
                                            </label>
                                            <label class="checkbox-label">
                                                <input type="checkbox" id="editIsVerified" ${user.is_verified ? 'checked' : ''}>
                                                Verified
                                            </label>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Joined</label>
                                <div class="form-value">${new Date(user.created_at).toLocaleDateString()}</div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Last Active</label>
                                <div class="form-value">${user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${isEditMode ? `
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Cancel
                        </button>
                        <button class="btn btn-primary" onclick="userManager.saveUser('${user.id}')">
                            💾 Save Changes
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // 🎯 Setup user modal events
    setupUserModalEvents(modal, user) {
        // Add any specific event listeners for the edit modal
        // This could include avatar upload, validation, etc.
    }

    // 💾 Save user changes
    async saveUser(userId) {
        try {
            const userData = {
                full_name: document.getElementById('editFullName').value,
                username: document.getElementById('editUsername').value,
                email: document.getElementById('editEmail').value,
                role: document.getElementById('editRole').value,
                skill_level: document.getElementById('editSkillLevel').value,
                is_active: document.getElementById('editIsActive').checked,
                is_verified: document.getElementById('editIsVerified').checked
            };
            
            const response = await this.api.updateUser(userId, userData);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to update user');
            }
            
            this.showSuccessMessage('User updated successfully');
            document.querySelector('.modal-overlay').remove();
            await this.loadUsers(this.currentPage, this.currentFilters);
            
        } catch (error) {
            console.error('❌ Failed to save user:', error);
            this.showErrorMessage('Failed to save user: ' + error.message);
        }
    }

    // 🔄 Loading states
    showLoadingState() {
        const tableBody = document.getElementById('usersTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="loading-state">
                        <div class="loading-spinner"></div>
                        <div>Loading users...</div>
                    </td>
                </tr>
            `;
        }
    }

    hideLoadingState() {
        // Loading state will be replaced by renderUsers()
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
window.UserManager = UserManager;