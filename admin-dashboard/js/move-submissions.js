// 💃 Dancify Admin Dashboard - Move Submissions Management
// Handles user video submission reviews, approvals, and feedback
// Complete system for reviewing and moderating user-generated content

class DancifySubmissions {
    constructor() {
        this.api = null;
        this.submissions = [];
        this.filteredSubmissions = [];
        this.currentFilter = { status: 'pending' };
        this.isLoading = false;
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.totalItems = 0;
        this.currentVideoModal = null;
        
        // Review status options
        this.statusOptions = [
            { value: 'pending', label: 'Pending Review', color: '#FFC107', icon: '⏳' },
            { value: 'approved', label: 'Approved', color: '#28A745', icon: '✅' },
            { value: 'rejected', label: 'Rejected', color: '#DC3545', icon: '❌' },
            { value: 'needs_revision', label: 'Needs Revision', color: '#FF6B35', icon: '🔄' }
        ];
        
        // Feedback templates
        this.feedbackTemplates = [
            'Great technique! Your form looks excellent.',
            'Nice effort! Try to keep your posture more upright.',
            'Good rhythm! Focus on sharper movements for better definition.',
            'Excellent execution! This submission has been approved.',
            'Please work on timing with the music and resubmit.',
            'Beautiful flow! Your transitions are very smooth.',
            'Good attempt! Try to extend your limbs more fully.',
            'Outstanding performance! Perfect technique demonstrated.'
        ];
    }

    // 🚀 Initialize submissions management
    async init() {
        try {
            console.log('📹 Initializing Move Submissions Management...');
            
            this.api = window.dancifyAdmin?.modules?.api;
            if (!this.api) {
                throw new Error('API client not available');
            }
            
            await this.loadSubmissions();
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            
            console.log('✅ Move Submissions Management initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize submissions management:', error);
            this.showErrorState();
        }
    }

    // 📚 Load submissions with filtering and pagination
    async loadSubmissions(filters = {}, page = 1) {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.showLoadingState();
            
            const params = {
                ...this.currentFilter,
                ...filters,
                page,
                limit: this.itemsPerPage
            };
            
            const response = await this.api.getMoveSubmissions(params);
            
            if (response.success) {
                this.submissions = response.data.submissions || [];
                this.totalItems = response.data.total || 0;
                this.currentPage = page;
                this.currentFilter = { ...this.currentFilter, ...filters };
                
                this.displaySubmissions();
                this.updatePagination();
                this.updateFilterCounts();
            } else {
                throw new Error(response.message || 'Failed to load submissions');
            }
            
        } catch (error) {
            console.error('❌ Failed to load submissions:', error);
            this.showErrorMessage('Failed to load move submissions');
            // Show mock data for development
            this.loadMockSubmissions();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    // 🎭 Load mock submissions for development
    loadMockSubmissions() {
        this.submissions = [
            {
                id: 'sub_001',
                userId: 'user_001',
                userName: 'Emma Rodriguez',
                userAvatar: null,
                moveId: 'move_001',
                moveName: 'Basic Pirouette',
                danceStyle: 'Ballet',
                videoUrl: 'https://example.com/video1.mp4',
                thumbnailUrl: 'https://via.placeholder.com/300x200/8A2BE2/FFFFFF?text=Pirouette',
                status: 'pending',
                submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                reviewedAt: null,
                reviewedBy: null,
                feedback: null,
                score: null,
                difficulty: 'intermediate',
                duration: 45
            },
            {
                id: 'sub_002',
                userId: 'user_002',
                userName: 'Marcus Johnson',
                userAvatar: null,
                moveId: 'move_002',
                moveName: 'Hip-Hop Freeze',
                danceStyle: 'Hip-Hop',
                videoUrl: 'https://example.com/video2.mp4',
                thumbnailUrl: 'https://via.placeholder.com/300x200/FF6B35/FFFFFF?text=Freeze',
                status: 'approved',
                submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                reviewedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                reviewedBy: 'admin_001',
                feedback: 'Excellent technique! Great control and form.',
                score: 95,
                difficulty: 'advanced',
                duration: 30
            },
            {
                id: 'sub_003',
                userId: 'user_003',
                userName: 'Sofia Chen',
                userAvatar: null,
                moveId: 'move_003',
                moveName: 'Salsa Basic Step',
                danceStyle: 'Salsa',
                videoUrl: 'https://example.com/video3.mp4',
                thumbnailUrl: 'https://via.placeholder.com/300x200/FF1493/FFFFFF?text=Salsa',
                status: 'needs_revision',
                submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
                reviewedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                reviewedBy: 'admin_001',
                feedback: 'Good rhythm! Try to keep your upper body more upright and work on foot placement.',
                score: 72,
                difficulty: 'beginner',
                duration: 60
            }
        ];
        
        this.totalItems = this.submissions.length;
        this.displaySubmissions();
        this.updateFilterCounts();
    }

    // 🎨 Display submissions
    displaySubmissions() {
        const container = document.getElementById('submissionsContainer');
        if (!container) return;
        
        if (this.submissions.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }
        
        container.innerHTML = `
            <div class="submissions-grid">
                ${this.submissions.map(submission => this.createSubmissionCard(submission)).join('')}
            </div>
        `;
        
        this.attachSubmissionEvents();
    }

    // 📹 Create submission card
    createSubmissionCard(submission) {
        const status = this.statusOptions.find(s => s.value === submission.status);
        const timeAgo = this.formatTimeAgo(submission.submittedAt);
        const avatar = submission.userAvatar || this.generateAvatarUrl(submission.userName);
        
        return `
            <div class="submission-card" data-submission-id="${submission.id}">
                <div class="submission-thumbnail" onclick="submissionManager.playVideo('${submission.id}')">
                    <img src="${submission.thumbnailUrl}" alt="${submission.moveName}" loading="lazy">
                    <div class="play-overlay">
                        <div class="play-button">▶️</div>
                    </div>
                    <div class="video-duration">${this.formatDuration(submission.duration)}</div>
                    <div class="status-badge" style="background-color: ${status.color}">
                        ${status.icon} ${status.label}
                    </div>
                </div>
                
                <div class="submission-content">
                    <div class="submission-header">
                        <h4 class="move-name">${this.escapeHtml(submission.moveName)}</h4>
                        <span class="dance-style">${submission.danceStyle}</span>
                    </div>
                    
                    <div class="user-info">
                        <img src="${avatar}" alt="${submission.userName}" class="user-avatar">
                        <div class="user-details">
                            <span class="user-name">${this.escapeHtml(submission.userName)}</span>
                            <span class="submission-time">${timeAgo}</span>
                        </div>
                    </div>
                    
                    ${submission.score ? `
                        <div class="submission-score">
                            <span class="score-label">Score:</span>
                            <span class="score-value ${this.getScoreClass(submission.score)}">${submission.score}/100</span>
                        </div>
                    ` : ''}
                    
                    ${submission.feedback ? `
                        <div class="submission-feedback">
                            <p>${this.escapeHtml(this.truncateText(submission.feedback, 100))}</p>
                        </div>
                    ` : ''}
                    
                    <div class="submission-actions">
                        ${submission.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="submissionManager.quickApprove('${submission.id}')">
                                ✅ Approve
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="submissionManager.requestRevision('${submission.id}')">
                                🔄 Revision
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="submissionManager.quickReject('${submission.id}')">
                                ❌ Reject
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-ghost" onclick="submissionManager.viewSubmissionDetails('${submission.id}')">
                                👁️ View Details
                            </button>
                        `}
                        <button class="btn btn-sm btn-primary" onclick="submissionManager.showReviewModal('${submission.id}')">
                            📝 Review
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // ▶️ Play video in modal
    playVideo(submissionId) {
        const submission = this.submissions.find(s => s.id === submissionId);
        if (!submission) return;
        
        this.showVideoModal(submission);
    }

    // 🎬 Show video modal
    showVideoModal(submission) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay video-modal';
        modal.innerHTML = `
            <div class="modal modal-xl">
                <div class="modal-header">
                    <h2 class="modal-title">📹 ${this.escapeHtml(submission.moveName)} - ${this.escapeHtml(submission.userName)}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                
                <div class="modal-body video-modal-body">
                    <div class="video-section">
                        <div class="video-container">
                            <video controls autoplay>
                                <source src="${submission.videoUrl}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        
                        <div class="video-info">
                            <div class="info-grid">
                                <div class="info-item">
                                    <strong>Move:</strong> ${submission.moveName}
                                </div>
                                <div class="info-item">
                                    <strong>Style:</strong> ${submission.danceStyle}
                                </div>
                                <div class="info-item">
                                    <strong>Difficulty:</strong> ${submission.difficulty}
                                </div>
                                <div class="info-item">
                                    <strong>Duration:</strong> ${this.formatDuration(submission.duration)}
                                </div>
                                <div class="info-item">
                                    <strong>Submitted:</strong> ${this.formatDateTime(submission.submittedAt)}
                                </div>
                                <div class="info-item">
                                    <strong>Status:</strong> 
                                    <span class="status-badge">${submission.status}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="review-section">
                        <h4>Quick Review</h4>
                        <div class="quick-review-actions">
                            <button class="btn btn-success" onclick="submissionManager.quickApprove('${submission.id}')">
                                ✅ Approve
                            </button>
                            <button class="btn btn-warning" onclick="submissionManager.requestRevision('${submission.id}')">
                                🔄 Request Revision
                            </button>
                            <button class="btn btn-danger" onclick="submissionManager.quickReject('${submission.id}')">
                                ❌ Reject
                            </button>
                            <button class="btn btn-primary" onclick="submissionManager.showReviewModal('${submission.id}')">
                                📝 Detailed Review
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.classList.add('show');
        this.currentVideoModal = modal;
        
        // Pause video when modal closes
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                const video = modal.querySelector('video');
                if (video) video.pause();
                modal.remove();
            }
        });
    }

    // 📝 Show detailed review modal
    showReviewModal(submissionId) {
        const submission = this.submissions.find(s => s.id === submissionId);
        if (!submission) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h2 class="modal-title">📝 Review Submission</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                
                <div class="modal-body">
                    <div class="review-form">
                        <div class="submission-summary">
                            <h4>${submission.moveName} by ${submission.userName}</h4>
                            <p>Dance Style: ${submission.danceStyle} | Difficulty: ${submission.difficulty}</p>
                        </div>
                        
                        <form id="reviewForm">
                            <div class="form-group">
                                <label class="form-label required">Review Status</label>
                                <select class="form-control form-select" name="status" required>
                                    ${this.statusOptions.map(option => `
                                        <option value="${option.value}" ${submission.status === option.value ? 'selected' : ''}>
                                            ${option.icon} ${option.label}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Score (0-100)</label>
                                <input type="number" class="form-control" name="score" 
                                       min="0" max="100" value="${submission.score || ''}"
                                       placeholder="Optional numerical score">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Feedback</label>
                                <textarea class="form-control form-textarea" name="feedback" 
                                          placeholder="Provide constructive feedback..." rows="4">${submission.feedback || ''}</textarea>
                                
                                <div class="feedback-templates">
                                    <label class="form-label">Quick Templates:</label>
                                    <div class="template-buttons">
                                        ${this.feedbackTemplates.map((template, index) => `
                                            <button type="button" class="btn btn-sm btn-ghost template-btn" 
                                                    onclick="submissionManager.useFeedbackTemplate('${template}')">
                                                ${template.substring(0, 30)}${template.length > 30 ? '...' : ''}
                                            </button>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Internal Notes</label>
                                <textarea class="form-control form-textarea" name="internalNotes" 
                                          placeholder="Private notes for other admins..." rows="2"></textarea>
                                <div class="form-help">These notes are not visible to the user</div>
                            </div>
                            
                            <input type="hidden" name="submissionId" value="${submission.id}">
                        </form>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancel
                    </button>
                    <button class="btn btn-primary" onclick="submissionManager.saveReview()">
                        💾 Save Review
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    // 📝 Use feedback template
    useFeedbackTemplate(template) {
        const feedbackTextarea = document.querySelector('[name="feedback"]');
        if (feedbackTextarea) {
            feedbackTextarea.value = template;
        }
    }

    // 💾 Save review
    async saveReview() {
        const form = document.getElementById('reviewForm');
        if (!form) return;
        
        try {
            const formData = new FormData(form);
            const reviewData = Object.fromEntries(formData.entries());
            
            if (!reviewData.status) {
                this.showErrorMessage('Please select a review status');
                return;
            }
            
            // Convert score to number
            if (reviewData.score) {
                reviewData.score = parseInt(reviewData.score);
            }
            
            const response = await this.api.reviewMoveSubmission(reviewData.submissionId, reviewData);
            
            if (response.success) {
                this.showNotification('Review saved successfully', 'success');
                form.closest('.modal-overlay').remove();
                
                // Close video modal if open
                if (this.currentVideoModal) {
                    this.currentVideoModal.remove();
                    this.currentVideoModal = null;
                }
                
                await this.loadSubmissions(this.currentFilter, this.currentPage);
            } else {
                throw new Error(response.message || 'Failed to save review');
            }
            
        } catch (error) {
            console.error('❌ Failed to save review:', error);
            this.showErrorMessage('Failed to save review');
        }
    }

    // ✅ Quick approve
    async quickApprove(submissionId) {
        try {
            const response = await this.api.approveMoveSubmission(submissionId);
            if (response.success) {
                this.showNotification('Submission approved successfully', 'success');
                await this.loadSubmissions(this.currentFilter, this.currentPage);
            }
        } catch (error) {
            console.error('❌ Failed to approve submission:', error);
            this.showErrorMessage('Failed to approve submission');
        }
    }

    // ❌ Quick reject
    async quickReject(submissionId) {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;
        
        try {
            const response = await this.api.rejectMoveSubmission(submissionId, reason);
            if (response.success) {
                this.showNotification('Submission rejected', 'success');
                await this.loadSubmissions(this.currentFilter, this.currentPage);
            }
        } catch (error) {
            console.error('❌ Failed to reject submission:', error);
            this.showErrorMessage('Failed to reject submission');
        }
    }

    // 🔄 Request revision
    async requestRevision(submissionId) {
        const feedback = prompt('Please provide feedback for revision:');
        if (!feedback) return;
        
        try {
            const reviewData = {
                status: 'needs_revision',
                feedback: feedback
            };
            
            const response = await this.api.reviewMoveSubmission(submissionId, reviewData);
            if (response.success) {
                this.showNotification('Revision requested', 'success');
                await this.loadSubmissions(this.currentFilter, this.currentPage);
            }
        } catch (error) {
            console.error('❌ Failed to request revision:', error);
            this.showErrorMessage('Failed to request revision');
        }
    }

    // 🎯 Setup event listeners
    setupEventListeners() {
        // Status filter tabs
        const statusTabs = document.querySelectorAll('.status-tab');
        statusTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const status = tab.dataset.status;
                this.filterByStatus(status);
            });
        });
        
        // Search functionality
        const searchInput = document.getElementById('submissionSearch');
        if (searchInput) {
            searchInput.addEventListener('input', 
                this.debounce(() => this.performSearch(), 300)
            );
        }
        
        // Bulk actions
        const bulkActionButton = document.getElementById('bulkActionButton');
        if (bulkActionButton) {
            bulkActionButton.addEventListener('click', () => this.showBulkActionModal());
        }
    }

    // ⌨️ Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Only handle shortcuts when no modal is open
            if (document.querySelector('.modal-overlay.show')) return;
            
            switch (event.key) {
                case '1':
                    event.preventDefault();
                    this.filterByStatus('pending');
                    break;
                case '2':
                    event.preventDefault();
                    this.filterByStatus('approved');
                    break;
                case '3':
                    event.preventDefault();
                    this.filterByStatus('rejected');
                    break;
                case '4':
                    event.preventDefault();
                    this.filterByStatus('needs_revision');
                    break;
                case 'r':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        this.refresh();
                    }
                    break;
            }
        });
    }

    // 🔍 Filter by status
    async filterByStatus(status) {
        // Update active tab
        document.querySelectorAll('.status-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.status === status);
        });
        
        const filters = status === 'all' ? {} : { status };
        await this.loadSubmissions(filters, 1);
    }

    // 🔍 Perform search
    async performSearch() {
        const searchInput = document.getElementById('submissionSearch');
        const query = searchInput?.value?.trim() || '';
        
        const filters = { ...this.currentFilter };
        if (query) {
            filters.search = query;
        } else {
            delete filters.search;
        }
        
        await this.loadSubmissions(filters, 1);
    }

    // 📊 Update filter counts
    updateFilterCounts() {
        const counts = {
            all: this.submissions.length,
            pending: this.submissions.filter(s => s.status === 'pending').length,
            approved: this.submissions.filter(s => s.status === 'approved').length,
            rejected: this.submissions.filter(s => s.status === 'rejected').length,
            needs_revision: this.submissions.filter(s => s.status === 'needs_revision').length
        };
        
        Object.entries(counts).forEach(([status, count]) => {
            const tab = document.querySelector(`[data-status="${status}"]`);
            if (tab) {
                const badge = tab.querySelector('.count-badge');
                if (badge) {
                    badge.textContent = count;
                }
            }
        });
    }

    // 📄 Update pagination
    updatePagination() {
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        const paginationContainer = document.getElementById('submissionsPagination');
        
        if (!paginationContainer || totalPages <= 1) {
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `
                <button class="pagination-item" onclick="submissionManager.loadSubmissions(submissionManager.currentFilter, ${this.currentPage - 1})">
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
                        onclick="submissionManager.loadSubmissions(submissionManager.currentFilter, ${i})">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <button class="pagination-item" onclick="submissionManager.loadSubmissions(submissionManager.currentFilter, ${this.currentPage + 1})">
                    Next →
                </button>
            `;
        }
        
        paginationContainer.innerHTML = paginationHTML;
    }

    // 👁️ View submission details
    async viewSubmissionDetails(submissionId) {
        const submission = this.submissions.find(s => s.id === submissionId);
        if (!submission) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h2 class="modal-title">📹 Submission Details</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                
                <div class="modal-body">
                    <div class="submission-details">
                        <div class="detail-section">
                            <h4>Basic Information</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Submission ID:</strong> ${submission.id}
                                </div>
                                <div class="detail-item">
                                    <strong>User:</strong> ${submission.userName}
                                </div>
                                <div class="detail-item">
                                    <strong>Move:</strong> ${submission.moveName}
                                </div>
                                <div class="detail-item">
                                    <strong>Dance Style:</strong> ${submission.danceStyle}
                                </div>
                                <div class="detail-item">
                                    <strong>Difficulty:</strong> ${submission.difficulty}
                                </div>
                                <div class="detail-item">
                                    <strong>Duration:</strong> ${this.formatDuration(submission.duration)}
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Review Information</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Status:</strong> 
                                    <span class="status-badge">${submission.status}</span>
                                </div>
                                <div class="detail-item">
                                    <strong>Submitted:</strong> ${this.formatDateTime(submission.submittedAt)}
                                </div>
                                <div class="detail-item">
                                    <strong>Reviewed:</strong> ${submission.reviewedAt ? this.formatDateTime(submission.reviewedAt) : 'Not yet reviewed'}
                                </div>
                                <div class="detail-item">
                                    <strong>Reviewed By:</strong> ${submission.reviewedBy || 'N/A'}
                                </div>
                                <div class="detail-item">
                                    <strong>Score:</strong> ${submission.score ? `${submission.score}/100` : 'No score assigned'}
                                </div>
                            </div>
                        </div>
                        
                        ${submission.feedback ? `
                            <div class="detail-section">
                                <h4>Feedback</h4>
                                <div class="feedback-content">
                                    <p>${this.escapeHtml(submission.feedback)}</p>
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="detail-section">
                            <h4>Video</h4>
                            <div class="video-preview">
                                <img src="${submission.thumbnailUrl}" alt="Video thumbnail" 
                                     onclick="submissionManager.playVideo('${submission.id}')"
                                     style="cursor: pointer; max-width: 300px; border-radius: 8px;">
                                <p>Click thumbnail to play video</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Close
                    </button>
                    <button class="btn btn-primary" onclick="submissionManager.showReviewModal('${submission.id}'); this.closest('.modal-overlay').remove();">
                        📝 Review
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    // 🔄 Refresh submissions
    async refresh() {
        await this.loadSubmissions(this.currentFilter, this.currentPage);
    }

    // 🔧 Utility methods
    attachSubmissionEvents() {
        // Events are attached via onclick attributes in the HTML
    }

    generateAvatarUrl(userName) {
        const colors = ['FF6B35', '8A2BE2', 'FF1493', '32CD32', 'FFD700', '9370DB'];
        const colorIndex = userName.length % colors.length;
        const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        return `https://via.placeholder.com/40x40/${colors[colorIndex]}/FFFFFF?text=${initials}`;
    }

    formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    }

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    formatDuration(seconds) {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    getScoreClass(score) {
        if (score >= 90) return 'excellent';
        if (score >= 80) return 'good';
        if (score >= 70) return 'average';
        return 'needs-improvement';
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
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

    // 🎨 UI Helper methods
    getEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">📹</div>
                <h3>No submissions found</h3>
                <p>No move submissions match your current filters.</p>
                <button class="btn btn-primary" onclick="submissionManager.loadSubmissions({}, 1)">
                    🔄 Show All
                </button>
            </div>
        `;
    }

    showLoadingState() {
        const container = document.getElementById('submissionsContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Loading submissions...</p>
                </div>
            `;
        }
    }

    hideLoadingState() {
        // Loading state is replaced by displaySubmissions()
    }

    showErrorState() {
        const container = document.getElementById('submissionsContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Failed to load submissions</h3>
                    <p>Please check your connection and try again.</p>
                    <button class="btn btn-primary" onclick="submissionManager.loadSubmissions()">
                        🔄 Retry
                    </button>
                </div>
            `;
        }
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
        this.submissions = [];
        this.filteredSubmissions = [];
        this.currentFilter = { status: 'pending' };
        this.currentVideoModal = null;
        console.log('🧹 Move submissions management cleanup completed');
    }
}

// 🌐 Export for global use
window.DancifySubmissions = DancifySubmissions;

// Create global instance
window.submissionManager = new DancifySubmissions();

console.log('📹 Dancify Move Submissions Management loaded');