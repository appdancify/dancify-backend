// 💃 Dancify Admin Dashboard - User Management
// Real-time user data management with backend integration and fallback

class UserManager {
    constructor(apiClient) {
        this.api = apiClient;
        this.users = [];
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalUsers = 0;
        this.currentFilters = {};
        this.selectedUsers = new Set();
        this.isLoading = false;
        
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
            
            // Set up filters
            this.setupFilters();
            
            console.log('✅ User Management initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize User Management:', error);
            this.showErrorMessage('Failed to initialize user management: ' + error.message);
            
            // Load fallback data if initialization fails
            this.loadFallbackData();
        }
    }

    // 📊 Load users from API - ENHANCED WITH FALLBACK
    async loadUsers(page = 1, filters = {}) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.currentPage = page;
        this.currentFilters = filters;
        
        console.log(`📊 Loading users (page ${page})...`);
        
        try {
            this.showLoadingState();
            
            // Try to load from real API first
            if (this.api && typeof this.api.getUsers === 'function') {
                console.log('🌐 Fetching users from API...');
                
                const queryParams = {
                    page,
                    limit: this.pageSize,
                    ...filters
                };
                
                const response = await this.api.getUsers(queryParams);
                
                if (response && response.success && response.data) {
                    this.users = response.data;
                    this.totalUsers = response.pagination?.total || this.users.length;
                    console.log(`✅ Loaded ${this.users.length} users from API`);
                } else {
                    console.warn('⚠️ API returned no data, using fallback');
                    this.users = this.getMockUsers();
                    this.totalUsers = this.users.length;
                    this.showErrorMessage('Using demo data - API returned no results');
                }
            } else {
                console.warn('⚠️ API client not available, using fallback data');
                this.users = this.getMockUsers();
                this.totalUsers = this.users.length;
                this.showErrorMessage('Using demo data - backend connection unavailable');
            }
            
            this.renderUsers();
            this.renderPagination();
            this.updateUserStats();
            
        } catch (error) {
            console.error('❌ Failed to load users:', error);
            this.showErrorMessage('Failed to load users: ' + error.message);
            
            // Fallback to mock data
            this.users = this.getMockUsers();
            this.totalUsers = this.users.length;
            this.renderUsers();
            this.updateUserStats();
        } finally {
            this.isLoading = false;
        }
    }

    // 🔄 Load fallback data when API fails
    loadFallbackData() {
        console.log('🔄 Loading fallback users data...');
        
        try {
            this.users = this.getMockUsers();
            this.totalUsers = this.users.length;
            this.renderUsers();
            this.updateUserStats();
            this.showErrorMessage('Using demo data - backend connection failed');
        } catch (error) {
            console.error('❌ Failed to load fallback data:', error);
        }
    }

    // 🎯 Generate mock users data
    getMockUsers() {
        return [
            {
                id: 'user-001',
                username: 'danceQueen123',
                email: 'sarah.johnson@email.com',
                first_name: 'Sarah',
                last_name: 'Johnson',
                role: 'instructor',
                status: 'active',
                is_verified: true,
                avatar_url: null,
                created_at: '2024-01-15T10:30:00Z',
                last_active: '2024-03-20T14:45:00Z',
                stats: {
                    submissions: 45,
                    moves_learned: 128,
                    points: 2340
                },
                profile: {
                    bio: 'Professional dance instructor specializing in contemporary and jazz',
                    location: 'New York, NY',
                    dance_styles: ['Contemporary', 'Jazz', 'Hip-Hop']
                }
            },
            {
                id: 'user-002',
                username: 'breakMaster',
                email: 'alex.rivera@email.com',
                first_name: 'Alex',
                last_name: 'Rivera',
                role: 'user',
                status: 'active',
                is_verified: true,
                avatar_url: null,
                created_at: '2024-02-10T09:15:00Z',
                last_active: '2024-03-22T16:20:00Z',
                stats: {
                    submissions: 23,
                    moves_learned: 67,
                    points: 1250
                },
                profile: {
                    bio: 'Breakdancing enthusiast and street dance performer',
                    location: 'Los Angeles, CA',
                    dance_styles: ['Breakdancing', 'Hip-Hop', 'Popping']
                }
            },
            {
                id: 'user-003',
                username: 'balletGrace',
                email: 'emma.thompson@email.com',
                first_name: 'Emma',
                last_name: 'Thompson',
                role: 'instructor',
                status: 'active',
                is_verified: true,
                avatar_url: null,
                created_at: '2024-01-20T08:45:00Z',
                last_active: '2024-03-21T11:30:00Z',
                stats: {
                    submissions: 67,
                    moves_learned: 95,
                    points: 3120
                },
                profile: {
                    bio: 'Classical ballet instructor with 15 years of experience',
                    location: 'Chicago, IL',
                    dance_styles: ['Ballet', 'Contemporary', 'Modern']
                }
            },
            {
                id: 'user-004',
                username: 'latinRhythm',
                email: 'carlos.mendez@email.com',
                first_name: 'Carlos',
                last_name: 'Mendez',
                role: 'user',
                status: 'active',
                is_verified: false,
                avatar_url: null,
                created_at: '2024-02-25T13:20:00Z',
                last_active: '2024-03-19T19:15:00Z',
                stats: {
                    submissions: 12,
                    moves_learned: 34,
                    points: 680
                },
                profile: {
                    bio: 'Passionate about Latin dance and cultural expression',
                    location: 'Miami, FL',
                    dance_styles: ['Salsa', 'Bachata', 'Merengue']
                }
            },
            {
                id: 'user-005',
                username: 'jazzFusion',
                email: 'maya.patel@email.com',
                first_name: 'Maya',
                last_name: 'Patel',
                role: 'moderator',
                status: 'active',
                is_verified: true,
                avatar_url: null,
                created_at: '2024-01-05T11:20:00Z',
                last_active: '2024-03-22T08:45:00Z',
                stats: {
                    submissions: 34,
                    moves_learned: 156,
                    points: 2890
                },
                profile: {
                    bio: 'Jazz dance specialist and community moderator',
                    location: 'Seattle, WA',
                    dance_styles: ['Jazz', 'Musical Theatre', 'Tap']
                }
            },
            {
                id: 'user-006',
                username: 'newDancer',
                email: 'jordan.smith@email.com',
                first_name: 'Jordan',
                last_name: 'Smith',
                role: 'user',
                status: 'pending',
                is_verified: false,
                avatar_url: null,
                created_at: '2024-03-18T16:30:00Z',
                last_active: '2024-03-20T12:10:00Z',
                stats: {
                    submissions: 2,
                    moves_learned: 8,
                    points: 120
                },
                profile: {
                    bio: 'Just starting my dance journey!',
                    location: 'Austin, TX',
                    dance_styles: ['Hip-Hop']
                }
            },
            {
                id: 'user-007',
                username: 'danceAdmin',
                email: 'admin@dancify.com',
                first_name: 'System',
                last_name: 'Administrator',
                role: 'admin',
                status: 'active',
                is_verified: true,
                avatar_url: null,
                created_at: '2024-01-01T00:00:00Z',
                last_active: '2024-03-22T20:00:00Z',
                stats: {
                    submissions: 0,
                    moves_learned: 0,
                    points: 0
                },
                profile: {
                    bio: 'Platform administrator',
                    location: 'Remote',
                    dance_styles: []
                }
            },
            {
                id: 'user-008',
                username: 'suspendedUser',
                email: 'suspended@email.com',
                first_name: 'Test',
                last_name: 'User',
                role: 'user',
                status: 'suspended',
                is_verified: false,
                avatar_url: null,
                created_at: '2024-02-01T10:00:00Z',
                last_active: '2024-03-15T14:20:00Z',
                stats: {
                    submissions: 5,
                    moves_learned: 15,
                    points: 200
                },
                profile: {
                    bio: 'Account suspended for policy violations',
                    location: 'Unknown',
                    dance_styles: ['Hip-Hop']
                }
            }
        ];
    }

    // 🎨 Render users in the grid
    renderUsers() {
        const usersContainer = document.getElementById('usersGrid');
        
        if (!usersContainer) {
            console.error('❌ Users container not found');
            return;
        }

        if (this.users.length === 0) {
            usersContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <div class="empty-title">No users found</div>
                    <div class="empty-description">No users match your current filters</div>
                    <button class="btn btn-primary" onclick="window.userManager.showCreateUserModal()">
                        ➕ Add First User
                    </button>
                </div>
            `;
            return;
        }

        const usersHTML = this.users.map(user => this.createUserCard(user)).join('');
        usersContainer.innerHTML = usersHTML;
        
        console.log(`✅ Rendered ${this.users.length} user cards`);
    }

    // 👤 Create user card HTML
    createUserCard(user) {
        const isSelected = this.selectedUsers.has(user.id);
        const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.username?.[0]?.toUpperCase() || '?';
        const joinDate = new Date(user.created_at).toLocaleDateString();
        const lastActive = this.formatTimeAgo(new Date(user.last_active));

        return `
            <div class="user-card ${isSelected ? 'selected' : ''}" data-user-id="${user.id}">
                <div class="user-card-header">
                    <input type="checkbox" class="user-checkbox" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="window.userManager.toggleUserSelection('${user.id}')">
                    <div class="user-actions">
                        <button class="action-btn edit-btn" title="Edit User" 
                                onclick="window.userManager.editUser('${user.id}')">
                            ✏️
                        </button>
                        <button class="action-btn delete-btn" title="Delete User" 
                                onclick="window.userManager.deleteUser('${user.id}')">
                            🗑️
                        </button>
                        ${user.status === 'active' ? 
                            `<button class="action-btn suspend-btn" title="Suspend User" 
                                     onclick="window.userManager.suspendUser('${user.id}')">⏸️</button>` :
                            `<button class="action-btn activate-btn" title="Activate User" 
                                     onclick="window.userManager.activateUser('${user.id}')">▶️</button>`
                        }
                    </div>
                </div>
                
                <div class="user-avatar-section">
                    <div class="user-avatar">
                        ${user.avatar_url ? 
                            `<img src="${user.avatar_url}" alt="${user.first_name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` :
                            initials
                        }
                    </div>
                    <div class="user-basic-info">
                        <h3 class="user-name">${user.first_name} ${user.last_name}</h3>
                        <p class="user-email">${user.email}</p>
                    </div>
                </div>
                
                <div class="user-meta">
                    <span class="role-badge role-${user.role}">${user.role}</span>
                    <span class="status-badge status-${user.status}">${user.status}</span>
                    ${user.is_verified ? 
                        '<span class="verification-badge verified">✓ Verified</span>' : 
                        '<span class="verification-badge unverified">Unverified</span>'
                    }
                </div>
                
                <div class="user-stats">
                    <div class="user-stat">
                        <span class="user-stat-value">${user.stats?.submissions || 0}</span>
                        <span class="user-stat-label">Submissions</span>
                    </div>
                    <div class="user-stat">
                        <span class="user-stat-value">${user.stats?.moves_learned || 0}</span>
                        <span class="user-stat-label">Moves</span>
                    </div>
                    <div class="user-stat">
                        <span class="user-stat-value">${user.stats?.points || 0}</span>
                        <span class="user-stat-label">Points</span>
                    </div>
                </div>
                
                <div class="user-footer">
                    <span class="join-date">Joined: ${joinDate}</span>
                    <span class="last-active">Active: ${lastActive}</span>
                </div>
            </div>
        `;
    }

    // 📊 Render pagination
    renderPagination() {
        const paginationContainer = document.getElementById('usersPagination');
        if (!paginationContainer || this.totalUsers <= this.pageSize) {
            if (paginationContainer) paginationContainer.style.display = 'none';
            return;
        }
        
        paginationContainer.style.display = 'flex';
        
        const totalPages = Math.ceil(this.totalUsers / this.pageSize);
        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `
                <button class="pagination-item" onclick="window.userManager.loadUsers(${this.currentPage - 1}, window.userManager.currentFilters)">
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
                        onclick="window.userManager.loadUsers(${i}, window.userManager.currentFilters)">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <button class="pagination-item" onclick="window.userManager.loadUsers(${this.currentPage + 1}, window.userManager.currentFilters)">
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
            active: this.users.filter(u => u.status === 'active').length,
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
        
        console.log('📊 User stats updated:', stats);
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

        // Refresh button
        const refreshBtn = document.getElementById('refreshUsersBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadUsers(this.currentPage, this.currentFilters);
            });
        }

        // Create user button
        const createBtn = document.getElementById('createUserBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateUserModal();
            });
        }

        // Bulk action buttons
        const bulkDeleteBtn = document.getElementById('bulkDeleteUsersBtn');
        const bulkSuspendBtn = document.getElementById('bulkSuspendBtn');
        
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => {
                this.bulkDeleteUsers();
            });
        }
        
        if (bulkSuspendBtn) {
            bulkSuspendBtn.addEventListener('click', () => {
                this.bulkSuspendUsers();
            });
        }
    }

    // 🔍 Setup filters
    setupFilters() {
        const roleFilter = document.getElementById('userRoleFilter');
        const statusFilter = document.getElementById('userStatusFilter');
        const verificationFilter = document.getElementById('verificationFilter');

        [roleFilter, statusFilter, verificationFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    this.applyFilters();
                });
            }
        });
    }

    // 🔍 Apply filters
    applyFilters() {
        const searchInput = document.getElementById('userSearchInput');
        const roleFilter = document.getElementById('userRoleFilter');
        const statusFilter = document.getElementById('userStatusFilter');
        const verificationFilter = document.getElementById('verificationFilter');
        
        const filters = {
            search: searchInput?.value.toLowerCase() || '',
            role: roleFilter?.value || '',
            status: statusFilter?.value || '',
            verification: verificationFilter?.value || ''
        };
        
        // Remove empty filters
        Object.keys(filters).forEach(key => {
            if (!filters[key]) delete filters[key];
        });
        
        this.currentFilters = filters;
        this.loadUsers(1, filters);
    }

    // 🔀 Toggle user selection
    toggleUserSelection(userId) {
        if (!this.selectedUsers) {
            this.selectedUsers = new Set();
        }
        
        if (this.selectedUsers.has(userId)) {
            this.selectedUsers.delete(userId);
        } else {
            this.selectedUsers.add(userId);
        }
        
        // Update UI
        const card = document.querySelector(`[data-user-id="${userId}"]`);
        if (card) {
            card.classList.toggle('selected', this.selectedUsers.has(userId));
            const checkbox = card.querySelector('.user-checkbox');
            if (checkbox) {
                checkbox.checked = this.selectedUsers.has(userId);
            }
        }
        
        // Update bulk action buttons
        this.updateBulkActionButtons();
        
        console.log(`🔀 User ${userId} ${this.selectedUsers.has(userId) ? 'selected' : 'deselected'}`);
    }

    // 🎯 Update bulk action buttons
    updateBulkActionButtons() {
        const bulkDeleteBtn = document.getElementById('bulkDeleteUsersBtn');
        const bulkSuspendBtn = document.getElementById('bulkSuspendBtn');
        
        const hasSelection = this.selectedUsers.size > 0;
        
        if (bulkDeleteBtn) {
            bulkDeleteBtn.disabled = !hasSelection;
        }
        if (bulkSuspendBtn) {
            bulkSuspendBtn.disabled = !hasSelection;
        }
    }

    // ➕ Show create user modal
    showCreateUserModal() {
        this.showSuccessMessage('Create user modal would open here');
    }

    // ✏️ Edit user
    async editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            this.showErrorMessage('User not found');
            return;
        }
        
        try {
            // In production, this would make an API call
            if (this.api && typeof this.api.updateUser === 'function') {
                console.log(`🌐 Would edit user ${userId} via API`);
            }
            
            this.showSuccessMessage(`Edit functionality for "${user.first_name} ${user.last_name}" would open here`);
            
        } catch (error) {
            console.error('❌ Error editing user:', error);
            this.showErrorMessage('Failed to edit user: ' + error.message);
        }
    }

    // 🗑️ Delete user
    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            this.showErrorMessage('User not found');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete "${user.first_name} ${user.last_name}"?\n\nThis action cannot be undone.`)) {
            return;
        }
        
        try {
            // Try API call first
            if (this.api && typeof this.api.deleteUser === 'function') {
                console.log(`🌐 Deleting user ${userId} via API...`);
                const response = await this.api.deleteUser(userId);
                
                if (response && response.success) {
                    console.log('✅ User deleted via API');
                } else {
                    throw new Error(response?.error || 'API deletion failed');
                }
            }
            
            // Remove from local array
            this.users = this.users.filter(u => u.id !== userId);
            this.selectedUsers.delete(userId);
            this.totalUsers = Math.max(0, this.totalUsers - 1);
            
            this.showSuccessMessage('User deleted successfully');
            this.renderUsers();
            this.updateUserStats();
            this.updateBulkActionButtons();
            
        } catch (error) {
            console.error('❌ Error deleting user:', error);
            this.showErrorMessage('Failed to delete user: ' + error.message);
        }
    }

    // ⏸️ Suspend user
    async suspendUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            this.showErrorMessage('User not found');
            return;
        }
        
        if (!confirm(`Are you sure you want to suspend "${user.first_name} ${user.last_name}"?`)) {
            return;
        }
        
        try {
            // Try API call first
            if (this.api && typeof this.api.updateUser === 'function') {
                console.log(`🌐 Suspending user ${userId} via API...`);
                const response = await this.api.updateUser(userId, { status: 'suspended' });
                
                if (response && response.success) {
                    console.log('✅ User suspended via API');
                } else {
                    throw new Error(response?.error || 'API update failed');
                }
            }
            
            // Update local data
            user.status = 'suspended';
            
            this.showSuccessMessage('User suspended successfully');
            this.renderUsers();
            this.updateUserStats();
            
        } catch (error) {
            console.error('❌ Error suspending user:', error);
            this.showErrorMessage('Failed to suspend user: ' + error.message);
        }
    }

    // ▶️ Activate user
    async activateUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            this.showErrorMessage('User not found');
            return;
        }
        
        try {
            // Try API call first
            if (this.api && typeof this.api.updateUser === 'function') {
                console.log(`🌐 Activating user ${userId} via API...`);
                const response = await this.api.updateUser(userId, { status: 'active' });
                
                if (response && response.success) {
                    console.log('✅ User activated via API');
                } else {
                    throw new Error(response?.error || 'API update failed');
                }
            }
            
            // Update local data
            user.status = 'active';
            
            this.showSuccessMessage('User activated successfully');
            this.renderUsers();
            this.updateUserStats();
            
        } catch (error) {
            console.error('❌ Error activating user:', error);
            this.showErrorMessage('Failed to activate user: ' + error.message);
        }
    }

    // 🗑️ Bulk delete users
    async bulkDeleteUsers() {
        if (this.selectedUsers.size === 0) {
            this.showErrorMessage('No users selected for deletion');
            return;
        }
        
        const confirmed = confirm(`Are you sure you want to delete ${this.selectedUsers.size} selected users?\n\nThis action cannot be undone.`);
        if (!confirmed) return;
        
        try {
            const userIds = Array.from(this.selectedUsers);
            console.log('🗑️ Bulk deleting users:', userIds);
            
            // Delete users one by one (in production, this might be a single bulk API call)
            for (const userId of userIds) {
                await this.deleteUser(userId);
            }
            
            this.selectedUsers.clear();
            this.showSuccessMessage(`${userIds.length} users deleted successfully`);
            
        } catch (error) {
            console.error('❌ Failed to bulk delete users:', error);
            this.showErrorMessage('Failed to delete some users: ' + error.message);
        }
    }

    // ⏸️ Bulk suspend users
    async bulkSuspendUsers() {
        if (this.selectedUsers.size === 0) {
            this.showErrorMessage('No users selected for suspension');
            return;
        }
        
        const confirmed = confirm(`Are you sure you want to suspend ${this.selectedUsers.size} selected users?`);
        if (!confirmed) return;
        
        try {
            const userIds = Array.from(this.selectedUsers);
            console.log('⏸️ Bulk suspending users:', userIds);
            
            // Suspend users one by one
            for (const userId of userIds) {
                await this.suspendUser(userId);
            }
            
            this.selectedUsers.clear();
            this.showSuccessMessage(`${userIds.length} users suspended successfully`);
            
        } catch (error) {
            console.error('❌ Failed to bulk suspend users:', error);
            this.showErrorMessage('Failed to suspend some users: ' + error.message);
        }
    }

    // ⏰ Format time ago
    formatTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }

    // 🔄 Loading states
    showLoadingState() {
        const usersContainer = document.getElementById('usersGrid');
        if (usersContainer) {
            usersContainer.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading users...</div>
                </div>
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