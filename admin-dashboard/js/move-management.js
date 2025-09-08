<!-- 💃 Dancify Admin Dashboard - Move Management Section -->
<!-- Complete dance move management with filters, stats, and grid -->

<section id="move-management" class="content-section">
    <!-- Section Header -->
    <div class="section-header">
        <div class="header-content">
            <h1>🕺 Move Management</h1>
            <p>Manage dance moves, difficulty levels, and instructional content</p>
        </div>
        <div class="header-actions">
            <button class="btn btn-secondary" id="refreshMovesBtn">
                🔄 Refresh
            </button>
            <button class="btn btn-primary" id="createMoveBtn">
                ➕ Create Move
            </button>
        </div>
    </div>

    <!-- Management Controls -->
    <div class="management-controls">
        <div class="search-section">
            <input type="text" id="moveSearchInput" placeholder="🔍 Search moves..." class="form-control">
        </div>
        
        <div class="filter-section">
            <select id="danceStyleFilter" class="form-control">
                <option value="">All Dance Styles</option>
                <option value="hip-hop">Hip-Hop</option>
                <option value="ballet">Ballet</option>
                <option value="contemporary">Contemporary</option>
                <option value="jazz">Jazz</option>
                <option value="latin">Latin</option>
                <option value="breakdance">Breakdance</option>
                <option value="ballroom">Ballroom</option>
                <option value="tap">Tap</option>
            </select>
            
            <select id="sectionFilter" class="form-control">
                <option value="">All Sections</option>
                <option value="Basic Steps">Basic Steps</option>
                <option value="Advanced Combos">Advanced Combos</option>
                <option value="Turns">Turns</option>
                <option value="Isolations">Isolations</option>
                <option value="Power Moves">Power Moves</option>
                <option value="Foundational Moves">Foundational Moves</option>
            </select>
            
            <select id="difficultyFilter" class="form-control">
                <option value="">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
            </select>
        </div>
        
        <div class="bulk-actions">
            <button class="btn btn-ghost" id="bulkDeleteBtn" disabled>
                🗑️ Delete Selected
            </button>
        </div>
    </div>

    <!-- Statistics Summary -->
    <div class="stats-summary">
        <div class="stat-item">
            <span class="stat-label">Total Moves</span>
            <span class="stat-value" id="totalMoves">0</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Difficulty Breakdown</span>
            <span class="stat-value" id="difficultyBreakdown">Loading...</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Total Views</span>
            <span class="stat-value" id="totalViews">0</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Average Rating</span>
            <span class="stat-value" id="averageRating">0.0</span>
        </div>
    </div>

    <!-- Moves Grid Container -->
    <div class="moves-container">
        <div id="movesGrid" class="moves-grid">
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading moves...</div>
            </div>
        </div>
    </div>

    <!-- Message Container -->
    <div id="messageContainer" class="message-container"></div>
</section>

<style>
/* Move Management Specific Styles */
.section-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    margin-bottom: 30px !important;
    padding: 20px !important;
    background: var(--bg-secondary, #f8f9fa) !important;
    border-radius: var(--radius-large, 12px) !important;
    box-shadow: var(--shadow-light, 0 2px 8px rgba(0,0,0,0.1)) !important;
}

.header-content h1 {
    margin: 0 !important;
    color: var(--text-primary, #333) !important;
    font-size: 1.8rem !important;
    font-weight: 700 !important;
}

.header-content p {
    margin: 5px 0 0 0 !important;
    color: var(--text-secondary, #666) !important;
    font-size: 0.95rem !important;
}

.header-actions {
    display: flex !important;
    gap: 12px !important;
}

.btn {
    padding: 10px 16px !important;
    border: none !important;
    border-radius: 6px !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    text-decoration: none !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
}

.btn-primary {
    background: #8A2BE2 !important;
    color: white !important;
}

.btn-primary:hover {
    background: #7A1FD2 !important;
    transform: translateY(-1px) !important;
}

.btn-secondary {
    background: #6c757d !important;
    color: white !important;
}

.btn-secondary:hover {
    background: #5a6268 !important;
}

.btn-ghost {
    background: transparent !important;
    color: #6c757d !important;
    border: 1px solid #dee2e6 !important;
}

.btn-ghost:hover {
    background: #f8f9fa !important;
    border-color: #adb5bd !important;
}

.btn:disabled {
    opacity: 0.6 !important;
    cursor: not-allowed !important;
    transform: none !important;
}

.management-controls {
    display: grid !important;
    grid-template-columns: 1fr auto auto !important;
    gap: 20px !important;
    align-items: center !important;
    margin-bottom: 25px !important;
    padding: 20px !important;
    background: var(--bg-secondary, #f8f9fa) !important;
    border-radius: var(--radius-large, 12px) !important;
    box-shadow: var(--shadow-light, 0 2px 8px rgba(0,0,0,0.1)) !important;
}

.search-section {
    display: flex !important;
    gap: 10px !important;
}

.filter-section {
    display: flex !important;
    gap: 10px !important;
}

.bulk-actions {
    display: flex !important;
    gap: 10px !important;
}

.form-control {
    padding: 8px 12px !important;
    border: 1px solid #dee2e6 !important;
    border-radius: 4px !important;
    font-size: 0.9rem !important;
    transition: border-color 0.2s ease !important;
}

.form-control:focus {
    outline: none !important;
    border-color: #8A2BE2 !important;
    box-shadow: 0 0 0 2px rgba(138, 43, 226, 0.2) !important;
}

.stats-summary {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
    gap: 20px !important;
    margin-bottom: 25px !important;
    padding: 20px !important;
    background: var(--bg-secondary, #f8f9fa) !important;
    border-radius: var(--radius-large, 12px) !important;
    box-shadow: var(--shadow-light, 0 2px 8px rgba(0,0,0,0.1)) !important;
}

.stat-item {
    text-align: center !important;
    padding: 15px !important;
    background: var(--bg-tertiary, white) !important;
    border-radius: var(--radius-medium, 8px) !important;
    border: 1px solid #e9ecef !important;
}

.stat-label {
    display: block !important;
    font-size: 0.85rem !important;
    color: var(--text-secondary, #666) !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
    margin-bottom: 8px !important;
    font-weight: 600 !important;
}

.stat-value {
    display: block !important;
    font-size: 1.8rem !important;
    font-weight: 700 !important;
    color: var(--primary-purple, #8A2BE2) !important;
}

.moves-container {
    background: var(--bg-secondary, #f8f9fa) !important;
    border-radius: var(--radius-large, 12px) !important;
    padding: 25px !important;
    min-height: 300px !important;
    box-shadow: var(--shadow-light, 0 2px 8px rgba(0,0,0,0.1)) !important;
}

.moves-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)) !important;
    gap: 20px !important;
}

/* Move Card Styles */
.move-card {
    background: white !important;
    border-radius: var(--radius-medium, 8px) !important;
    overflow: hidden !important;
    transition: all 0.3s ease !important;
    cursor: pointer !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
    border: 2px solid transparent !important;
}

.move-card:hover {
    transform: translateY(-4px) !important;
    box-shadow: 0 8px 25px rgba(138, 43, 226, 0.15) !important;
    border-color: var(--primary-purple, #8A2BE2) !important;
}

.move-card.selected {
    border-color: var(--primary-purple, #8A2BE2) !important;
    box-shadow: 0 6px 20px rgba(138, 43, 226, 0.2) !important;
}

.move-thumbnail {
    position: relative !important;
    height: 200px !important;
    overflow: hidden !important;
}

.move-thumbnail img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    transition: transform 0.3s ease !important;
}

.move-card:hover .move-thumbnail img {
    transform: scale(1.05) !important;
}

.move-overlay {
    position: absolute !important;
    top: 10px !important;
    right: 10px !important;
    display: flex !important;
    gap: 8px !important;
    opacity: 0 !important;
    transition: opacity 0.3s ease !important;
}

.move-card:hover .move-overlay {
    opacity: 1 !important;
}

.btn-icon {
    width: 32px !important;
    height: 32px !important;
    border-radius: 50% !important;
    background: rgba(0, 0, 0, 0.7) !important;
    color: white !important;
    border: none !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 0.8rem !important;
    transition: all 0.2s ease !important;
}

.btn-icon:hover {
    background: rgba(138, 43, 226, 0.9) !important;
    transform: scale(1.1) !important;
}

.play-button {
    position: absolute !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    width: 60px !important;
    height: 60px !important;
    background: rgba(138, 43, 226, 0.9) !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: white !important;
    font-size: 1.5rem !important;
    transition: all 0.3s ease !important;
}

.play-button:hover {
    background: rgba(138, 43, 226, 1) !important;
    transform: translate(-50%, -50%) scale(1.1) !important;
}

.move-info {
    padding: 16px !important;
}

.move-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    margin-bottom: 10px !important;
}

.move-title {
    font-size: 1.1rem !important;
    font-weight: 600 !important;
    color: #333 !important;
    margin: 0 !important;
    flex: 1 !important;
}

.difficulty-badge {
    padding: 4px 8px !important;
    border-radius: 4px !important;
    font-size: 0.75rem !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
}

.move-meta {
    display: flex !important;
    gap: 12px !important;
    margin-bottom: 8px !important;
    font-size: 0.8rem !important;
    color: #666 !important;
}

.move-description {
    font-size: 0.9rem !important;
    color: #555 !important;
    line-height: 1.4 !important;
    margin-bottom: 10px !important;
}

.move-stats {
    display: flex !important;
    justify-content: space-between !important;
    font-size: 0.8rem !important;
    color: #777 !important;
    border-top: 1px solid #eee !important;
    padding-top: 8px !important;
}

.empty-state {
    text-align: center !important;
    padding: 60px 20px !important;
    color: #666 !important;
}

.empty-icon {
    font-size: 4rem !important;
    margin-bottom: 20px !important;
}

.empty-title {
    font-size: 1.5rem !important;
    font-weight: 600 !important;
    margin-bottom: 10px !important;
    color: #333 !important;
}

.empty-description {
    font-size: 1rem !important;
    margin-bottom: 30px !important;
}

.loading-state {
    text-align: center !important;
    padding: 60px 20px !important;
    color: #666 !important;
}

.loading-spinner {
    width: 40px !important;
    height: 40px !important;
    border: 4px solid #f3f3f3 !important;
    border-top: 4px solid #8A2BE2 !important;
    border-radius: 50% !important;
    animation: spin 1s linear infinite !important;
    margin: 0 auto 20px auto !important;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading-text {
    font-size: 1rem !important;
    font-weight: 500 !important;
}

.message-container {
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    z-index: 10000 !important;
}

/* Responsive Design */
@media (max-width: 768px) {
    .section-header {
        flex-direction: column !important;
        gap: 15px !important;
        align-items: stretch !important;
    }
    
    .header-actions {
        justify-content: center !important;
    }
    
    .management-controls {
        grid-template-columns: 1fr !important;
        gap: 15px !important;
    }
    
    .filter-section {
        flex-direction: column !important;
        gap: 10px !important;
    }
    
    .stats-summary {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
    }
    
    .moves-grid {
        grid-template-columns: 1fr !important;
    }
}
</style>