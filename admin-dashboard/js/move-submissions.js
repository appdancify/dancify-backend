// 💃 Dancify Admin Dashboard - Submission Management
// Real-time move submission management with backend integration

class SubmissionManager {
    constructor(apiClient) {
        this.api = apiClient;
        this.submissions = [];
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalSubmissions = 0;
        this.currentFilters = {};
        this.selectedSubmissions = new Set();
        
        console.log('📹 Submission Manager initialized');
    }

    // 🚀 Initialize submission management
    async init() {
        try {
            console.log('📹 Initializing Submission Management...');
            
            // Load initial data
            await this.loadSubmissions();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up real-time updates
            this.setupRealTimeUpdates();
            
            console.log('✅ Submission Management initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Submission Management:', error);
            this.showErrorMessage('Failed to initialize submission management: ' + error.message);
        }
    }

    // 📊 Load submissions from API
    async loadSubmissions(page = 1, filters = {}) {
        try {
            console.log(`📊 Loading submissions (page ${page})...`);
            
            this.showLoadingState();
            
            const queryParams = {
                page,
                limit: this.pageSize,
                ...filters
            };
            
            const response = await this.api.getMoveSubmissions(queryParams);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load submissions');
            }
            
            this.submissions = response.data || [];
            this.currentPage = page;
            this.totalSubmissions = response.pagination?.total || 0;
            this.currentFilters = filters;
            
            this.renderSubmissions();
            this.renderPagination();
            this.updateSubmissionStats();
            
            this.hideLoadingState();
            
            console.log(`✅ Loaded ${this.submissions.length} submissions`);
            
        } catch (error) {
            console.error('❌ Failed to load submissions:', error);
            this.hideLoadingState();
            this.showErrorMessage('Failed to load submissions: ' + error.message);
        }
    }

    // 🎨 Render submissions grid
    renderSubmissions() {
        const submissionsContainer = document.getElementById('submissionsGrid');
        if (!submissionsContainer) {
            console.warn('⚠️ Submissions grid container not found');
            return;
        }
        
        if (this.submissions.length === 0) {
            submissionsContainer.innerHTML = `
                <div class="no-data">
                    <div class="no-data-content">
                        <div class="no-data-icon">📹</div>
                        <div class="no-data-text">No submissions found</div>
                        <div class="no-data-subtitle">Try adjusting your filters</div>
                    </div>
                </div>
            `;
            return;
        }
        
        const submissionCards = this.submissions.map(submission => this.createSubmissionCard(submission)).join('');
        submissionsContainer.innerHTML = submissionCards;
    }

    // 📹 Create submission card
    createSubmissionCard(submission) {
        const isSelected = this.selectedSubmissions.has(submission.id);
        const statusColor = this.getStatusColor(submission.status);
        const statusIcon = this.getStatusIcon(submission.status);
        const thumbnail = submission.thumbnail_url || `https://via.placeholder.com/300x200?text=${encodeURIComponent(submission.title)}`;
        const submittedDate = new Date(submission.created_at).toLocaleDateString();
        const submittedTime = new Date(submission.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="submission-card ${isSelected ? 'selected' : ''} status-${submission.status}" data-submission-id="${submission.id}">
                <div class="submission-header">
                    <input type="checkbox" class="submission-checkbox" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="submissionManager.toggleSubmissionSelection('${submission.id}')">
                    <div class="submission-status" style="color: ${statusColor}">
                        ${statusIcon} ${submission.status}
                    </div>
                    <div class="submission-actions">
                        <button class="btn btn-sm btn-ghost" onclick="submissionManager.viewSubmission('${submission.id}')" title="View Details">
                            👁️
                        </button>
                        ${submission.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="submissionManager.approveSubmission('${submission.id}')" title="Approve">
                                ✅
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="submissionManager.rejectSubmission('${submission.id}')" title="Reject">
                                ❌
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="submission-thumbnail">
                    <img src="${thumbnail}" alt="${submission.title}" loading="lazy">
                    <div class="submission-overlay">
                        <button class="play-button" onclick="submissionManager.playSubmissionVideo('${submission.id}')">
                            ▶️
                        </button>
                        ${submission.duration ? `<div class="duration-badge">${this.formatDuration(submission.duration)}</div>` : ''}
                    </div>
                </div>
                
                <div class="submission-info">
                    <h3 class="submission-title">${submission.title}</h3>
                    <p class="submission-description">${submission.description || 'No description provided'}</p>
                    
                    <div class="submission-meta">
                        <div class="user-info">
                            <img src="${submission.user_profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.user_profiles?.full_name || submission.user_profiles?.username || 'User')}&background=random`}" 
                                 alt="${submission.user_profiles?.username}" class="user-avatar">
                            <div class="user-details">
                                <div class="user-name">${submission.user_profiles?.full_name || submission.user_profiles?.username || 'Unknown User'}</div>
                                <div class="user-username">@${submission.user_profiles?.username || 'unknown'}</div>
                            </div>
                        </div>
                        
                        <div class="move-info">
                            <div class="move-name">${submission.dance_moves?.name || 'Unknown Move'}</div>
                            <div class="dance-style">${submission.dance_style || submission.dance_moves?.dance_style || 'Unknown Style'}</div>
                        </div>
                    </div>
                    
                    <div class="submission-footer">
                        <div class="submitted-date">
                            <span class="date-icon">📅</span>
                            <span class="date-text">${submittedDate}</span>
                            <span class="time-text">${submittedTime}</span>
                        </div>
                        
                        ${submission.tags && submission.tags.length > 0 ? `
                            <div class="submission-tags">
                                ${submission.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                                ${submission.tags.length > 3 ? `<span class="tag-more">+${submission.tags.length - 3}</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // 🎨 Get status color
    getStatusColor(status) {
        const colors = {
            'pending': '#ffc107',
            'under_review': '#17a2b8',
            'approved': '#28a745',
            'rejected': '#dc3545'
        };
        return colors[status] || '#6c757d';
    }

    // 🎭 Get status icon
    getStatusIcon(status) {
        const icons = {
            'pending': '⏳',
            'under_review': '👀',
            'approved': '✅',
            'rejected': '❌'
        };
        return icons[status] || '📹';
    }

    // ⏱️ Format duration
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // 📄 Render pagination
    renderPagination() {
        const paginationContainer = document.getElementById('submissionsPagination');
        if (!paginationContainer) return;
        
        const totalPages = Math.ceil(this.totalSubmissions / this.pageSize);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `
                <button class="pagination-item" onclick="submissionManager.loadSubmissions(${this.currentPage - 1}, submissionManager.currentFilters)">
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
                        onclick="submissionManager.loadSubmissions(${i}, submissionManager.currentFilters)">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <button class="pagination-item" onclick="submissionManager.loadSubmissions(${this.currentPage + 1}, submissionManager.currentFilters)">
                    Next →
                </button>
            `;
        }
        
        paginationContainer.innerHTML = paginationHTML;
    }

    // 📊 Update submission statistics
    updateSubmissionStats() {
        const stats = {
            total: this.totalSubmissions,
            pending: this.submissions.filter(s => s.status === 'pending').length,
            approved: this.submissions.filter(s => s.status === 'approved').length,
            rejected: this.submissions.filter(s => s.status === 'rejected').length,
            underReview: this.submissions.filter(s => s.status === 'under_review').length
        };
        
        // Update stat cards
        const totalSubmissionsEl = document.getElementById('totalSubmissionsCount');
        const pendingSubmissionsEl = document.getElementById('pendingSubmissionsCount');
        const approvedSubmissionsEl = document.getElementById('approvedSubmissionsCount');
        const rejectedSubmissionsEl = document.getElementById('rejectedSubmissionsCount');
        
        if (totalSubmissionsEl) totalSubmissionsEl.textContent = stats.total.toLocaleString();
        if (pendingSubmissionsEl) pendingSubmissionsEl.textContent = stats.pending.toLocaleString();
        if (approvedSubmissionsEl) approvedSubmissionsEl.textContent = stats.approved.toLocaleString();
        if (rejectedSubmissionsEl) rejectedSubmissionsEl.textContent = stats.rejected.toLocaleString();
    }

    // 🎯 Set up event listeners
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('submissionSearchInput');
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
        const filterElements = ['statusFilter', 'danceStyleFilter', 'dateFilter'];
        filterElements.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', () => {
                    this.applyFilters();
                });
            }
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshSubmissionsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshSubmissions();
            });
        }

        // Bulk action buttons
        const bulkApproveBtn = document.getElementById('bulkApproveBtn');
        const bulkRejectBtn = document.getElementById('bulkRejectBtn');
        
        if (bulkApproveBtn) {
            bulkApproveBtn.addEventListener('click', () => {
                this.bulkApproveSubmissions();
            });
        }
        
        if (bulkRejectBtn) {
            bulkRejectBtn.addEventListener('click', () => {
                this.bulkRejectSubmissions();
            });
        }
    }

    // 🔄 Set up real-time updates
    setupRealTimeUpdates() {
        // Refresh data every 3 minutes for pending submissions
        setInterval(() => {
            console.log('🔄 Auto-refreshing submission data...');
            this.loadSubmissions(this.currentPage, this.currentFilters);
        }, 3 * 60 * 1000);
    }

    // 🔍 Apply filters
    async applyFilters() {
        const searchInput = document.getElementById('submissionSearchInput');
        const statusFilter = document.getElementById('statusFilter');
        const styleFilter = document.getElementById('danceStyleFilter');
        const dateFilter = document.getElementById('dateFilter');

        const filters = {};

        if (searchInput?.value.trim()) {
            filters.search = searchInput.value.trim();
        }
        if (statusFilter?.value) {
            filters.status = statusFilter.value;
        }
        if (styleFilter?.value) {
            filters.dance_style = styleFilter.value;
        }
        if (dateFilter?.value) {
            const now = new Date();
            let startDate;
            
            switch (dateFilter.value) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
            }
            
            if (startDate) {
                filters.start_date = startDate.toISOString();
            }
        }

        await this.loadSubmissions(1, filters);
    }

    // 🧹 Clear filters
    async clearFilters() {
        document.getElementById('submissionSearchInput').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('danceStyleFilter').value = '';
        document.getElementById('dateFilter').value = '';

        await this.loadSubmissions(1, {});
    }

    // 🔄 Refresh submissions
    async refreshSubmissions() {
        console.log('🔄 Refreshing submission data...');
        await this.loadSubmissions(this.currentPage, this.currentFilters);
        this.showSuccessMessage('Submission data refreshed successfully');
    }

    // ✅ Toggle submission selection
    toggleSubmissionSelection(submissionId) {
        if (this.selectedSubmissions.has(submissionId)) {
            this.selectedSubmissions.delete(submissionId);
        } else {
            this.selectedSubmissions.add(submissionId);
        }
        
        this.updateBulkActionButtons();
    }

    // 🎯 Update bulk action buttons
    updateBulkActionButtons() {
        const bulkActionContainer = document.getElementById('bulkActionContainer');
        const selectedCount = this.selectedSubmissions.size;
        
        if (bulkActionContainer) {
            if (selectedCount > 0) {
                bulkActionContainer.style.display = 'block';
                bulkActionContainer.querySelector('.selected-count').textContent = selectedCount;
            } else {
                bulkActionContainer.style.display = 'none';
            }
        }
    }

    // ▶️ Play submission video
    async playSubmissionVideo(submissionId) {
        try {
            const response = await this.api.getMoveSubmission(submissionId);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load submission');
            }
            
            const submission = response.data;
            if (!submission.video_url) {
                this.showErrorMessage('No video URL available for this submission');
                return;
            }
            
            const videoModal = document.createElement('div');
            videoModal.className = 'modal-overlay video-modal';
            videoModal.innerHTML = `
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h2>🎥 ${submission.title}</h2>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="video-container">
                            <video controls autoplay style="width: 100%; max-height: 500px;">
                                <source src="${submission.video_url}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <div class="video-info">
                            <p><strong>User:</strong> ${submission.user_profiles?.full_name || submission.user_profiles?.username}</p>
                            <p><strong>Move:</strong> ${submission.dance_moves?.name}</p>
                            <p><strong>Description:</strong> ${submission.description || 'No description'}</p>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(videoModal);
            
        } catch (error) {
            console.error('❌ Failed to load submission video:', error);
            this.showErrorMessage('Failed to load submission video: ' + error.message);
        }
    }

    // 👁️ View submission details
    async viewSubmission(submissionId) {
        try {
            const response = await this.api.getMoveSubmission(submissionId);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load submission');
            }
            
            this.showSubmissionModal(response.data, 'view');
            
        } catch (error) {
            console.error('❌ Failed to load submission:', error);
            this.showErrorMessage('Failed to load submission details: ' + error.message);
        }
    }

    // ✅ Approve submission
    async approveSubmission(submissionId) {
        const confirmed = confirm('Are you sure you want to approve this submission?');
        if (!confirmed) return;
        
        try {
            const response = await this.api.approveMoveSubmission(submissionId);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to approve submission');
            }
            
            this.showSuccessMessage('Submission approved successfully');
            await this.loadSubmissions(this.currentPage, this.currentFilters);
            
        } catch (error) {
            console.error('❌ Failed to approve submission:', error);
            this.showErrorMessage('Failed to approve submission: ' + error.message);
        }
    }

    // ❌ Reject submission
    async rejectSubmission(submissionId) {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason || !reason.trim()) {
            this.showErrorMessage('Rejection reason is required');
            return;
        }
        
        try {
            const response = await this.api.rejectMoveSubmission(submissionId, reason.trim());
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to reject submission');
            }
            
            this.showSuccessMessage('Submission rejected successfully');
            await this.loadSubmissions(this.currentPage, this.currentFilters);
            
        } catch (error) {
            console.error('❌ Failed to reject submission:', error);
            this.showErrorMessage('Failed to reject submission: ' + error.message);
        }
    }

    // 📱 Show submission modal
    showSubmissionModal(submission, mode = 'view') {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = this.createSubmissionModalHTML(submission, mode);
        
        document.body.appendChild(modal);
    }

    // 🎨 Create submission modal HTML
    createSubmissionModalHTML(submission, mode) {
        const statusColor = this.getStatusColor(submission.status);
        const statusIcon = this.getStatusIcon(submission.status);
        const submittedDate = new Date(submission.created_at).toLocaleString();
        const reviewedDate = submission.reviewed_at ? new Date(submission.reviewed_at).toLocaleString() : null;
        
        return `
            <div class="modal modal-xl">
                <div class="modal-header">
                    <h2>📹 Submission Details</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                
                <div class="modal-body">
                    <div class="submission-details">
                        <div class="detail-section">
                            <h4>Basic Information</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Title:</strong> ${submission.title}
                                </div>
                                <div class="detail-item">
                                    <strong>Status:</strong> 
                                    <span style="color: ${statusColor}">${statusIcon} ${submission.status}</span>
                                </div>
                                <div class="detail-item">
                                    <strong>User:</strong> ${submission.user_profiles?.full_name || submission.user_profiles?.username}
                                </div>
                                <div class="detail-item">
                                    <strong>Move:</strong> ${submission.dance_moves?.name || 'Unknown'}
                                </div>
                                <div class="detail-item">
                                    <strong>Dance Style:</strong> ${submission.dance_style}
                                </div>
                                <div class="detail-item">
                                    <strong>Submitted:</strong> ${submittedDate}
                                </div>
                                ${reviewedDate ? `
                                    <div class="detail-item">
                                        <strong>Reviewed:</strong> ${reviewedDate}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        ${submission.description ? `
                            <div class="detail-section">
                                <h4>Description</h4>
                                <p>${submission.description}</p>
                            </div>
                        ` : ''}
                        
                        ${submission.video_url ? `
                            <div class="detail-section">
                                <h4>Video</h4>
                                <div class="video-container">
                                    <video controls style="width: 100%; max-height: 400px;">
                                        <source src="${submission.video_url}" type="video/mp4">
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${submission.tags && submission.tags.length > 0 ? `
                            <div class="detail-section">
                                <h4>Tags</h4>
                                <div class="tags-container">
                                    ${submission.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${submission.status === 'pending' ? `
                            <div class="detail-section">
                                <h4>Review Actions</h4>
                                <div class="review-actions">
                                    <button class="btn btn-success" onclick="submissionManager.approveSubmission('${submission.id}'); this.closest('.modal-overlay').remove();">
                                        ✅ Approve Submission
                                    </button>
                                    <button class="btn btn-danger" onclick="submissionManager.rejectSubmission('${submission.id}'); this.closest('.modal-overlay').remove();">
                                        ❌ Reject Submission
                                    </button>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // 🔄 Loading states
    showLoadingState() {
        const submissionsContainer = document.getElementById('submissionsGrid');
        if (submissionsContainer) {
            submissionsContainer.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <div>Loading submissions...</div>
                </div>
            `;
        }
    }

    hideLoadingState() {
        // Loading state will be replaced by renderSubmissions()
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
window.SubmissionManager = SubmissionManager;