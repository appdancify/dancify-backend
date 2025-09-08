/* 
 * 💃 Dancify Admin Dashboard - Main CSS
 * Dance-themed styling with purple/pink color scheme
 * Elegant and modern design for dance move management
 */

:root {
  /* Dance-themed Color Palette */
  --primary-purple: #8A2BE2;
  --primary-pink: #FF69B4;
  --secondary-purple: #9370DB;
  --secondary-pink: #FFB6C1;
  --accent-gold: #FFD700;
  --accent-rose: #FF1493;
  
  /* Background Colors */
  --bg-primary: #FAFAFA;
  --bg-secondary: #FFFFFF;
  --bg-tertiary: #F8F9FA;
  --bg-sidebar: #2D1B69;
  --bg-header: #FFFFFF;
  
  /* Text Colors */
  --text-primary: #2C3E50;
  --text-secondary: #6C757D;
  --text-light: #ADB5BD;
  --text-white: #FFFFFF;
  --text-purple: #8A2BE2;
  
  /* Status Colors */
  --success: #28A745;
  --warning: #FFC107;
  --danger: #DC3545;
  --info: #17A2B8;
  
  /* Shadows */
  --shadow-light: 0 2px 4px rgba(138, 43, 226, 0.1);
  --shadow-medium: 0 4px 8px rgba(138, 43, 226, 0.15);
  --shadow-heavy: 0 8px 16px rgba(138, 43, 226, 0.2);
  
  /* Border Radius */
  --radius-small: 4px;
  --radius-medium: 8px;
  --radius-large: 12px;
  --radius-xl: 16px;
  
  /* Transitions */
  --transition-fast: 0.2s ease;
  --transition-medium: 0.3s ease;
  --transition-slow: 0.5s ease;
  
  /* Layout */
  --sidebar-width: 280px;
  --header-height: 70px;
  --container-max-width: 1400px;
}

/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  overflow-x: hidden;
}

/* Loading Screen */
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, var(--primary-purple), var(--primary-pink));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  color: var(--text-white);
}

.loading-content {
  text-align: center;
  animation: fadeInUp 0.8s ease;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid var(--text-white);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.loading-content h2 {
  font-size: 2rem;
  margin-bottom: 10px;
  font-weight: 600;
}

.loading-content p {
  font-size: 1.1rem;
  opacity: 0.9;
}

/* Main Container */
.container {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

/* Sidebar */
.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-sidebar);
  color: var(--text-white);
  padding: 0;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: var(--shadow-heavy);
  transition: transform var(--transition-medium);
}

.sidebar-header {
  padding: 25px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, var(--primary-purple), var(--secondary-purple));
}

.sidebar-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.nav-section {
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.nav-section h3 {
  padding: 0 20px 15px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all var(--transition-fast);
  cursor: pointer;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-white);
  border-left-color: var(--primary-pink);
}

.nav-item.active {
  background: linear-gradient(90deg, rgba(255, 105, 180, 0.2), transparent);
  color: var(--text-white);
  border-left-color: var(--primary-pink);
  font-weight: 600;
}

.nav-icon {
  font-size: 1.2rem;
  margin-right: 12px;
  width: 20px;
  text-align: center;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg-primary);
}

/* Header */
.header {
  background: var(--bg-header);
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  box-shadow: var(--shadow-light);
  border-bottom: 1px solid #E9ECEF;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.sidebar-toggle {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-small);
  transition: background var(--transition-fast);
}

.sidebar-toggle:hover {
  background: var(--bg-tertiary);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-badge {
  position: relative;
}

.notification-badge::after {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: var(--danger);
  border-radius: 50%;
  border: 2px solid var(--bg-header);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-purple), var(--primary-pink));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--text-white);
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.user-avatar:hover {
  transform: scale(1.1);
}

/* Dropdown */
.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--bg-secondary);
  border: 1px solid #E9ECEF;
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-medium);
  min-width: 200px;
  padding: 8px 0;
  z-index: 1000;
  transform: translateY(10px);
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-fast);
}

.dropdown.show .dropdown-menu {
  transform: translateY(0);
  opacity: 1;
  visibility: visible;
}

.dropdown-item {
  display: block;
  padding: 12px 20px;
  color: var(--text-primary);
  text-decoration: none;
  font-size: 0.9rem;
  transition: background var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--bg-tertiary);
}

.dropdown-divider {
  border: none;
  border-top: 1px solid #E9ECEF;
  margin: 8px 0;
}

/* Content Container - FIXED */
.content-container {
  flex: 1;
  padding: 30px;
  max-width: var(--container-max-width);
  margin: 0 auto;
  width: 100%;
  min-height: calc(100vh - var(--header-height));
}

/* Content Sections - COMPLETELY FIXED */
.content-section {
  display: none;
  width: 100%;
  height: auto;
  min-height: 500px;
  animation: fadeIn var(--transition-medium);
}

.content-section.active {
  display: block !important;
  height: auto !important;
  min-height: 500px !important;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: var(--bg-secondary);
  padding: 25px;
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-light);
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
  border-color: var(--primary-purple);
}

.stat-card h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-card .value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-purple);
  margin-bottom: 5px;
  line-height: 1;
}

.stat-card .change {
  font-size: 0.85rem;
  color: var(--success);
  font-weight: 500;
}

.stat-card .change.negative {
  color: var(--danger);
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.chart-container {
  background: var(--bg-secondary);
  padding: 25px;
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-light);
}

.chart-container h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
}

/* Recent Activity */
.recent-activity {
  background: var(--bg-secondary);
  padding: 25px;
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-light);
}

.recent-activity h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.activity-list {
  space-y: 15px;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #F1F3F4;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 1.5rem;
  margin-right: 15px;
  width: 40px;
  text-align: center;
}

.activity-text {
  flex: 1;
  color: var(--text-primary);
  font-weight: 500;
}

.activity-time {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* Section Placeholders */
.section-placeholder {
  text-align: center;
  padding: 60px 20px;
  background: var(--bg-secondary);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-light);
}

.section-placeholder h2 {
  font-size: 2rem;
  color: var(--primary-purple);
  margin-bottom: 10px;
}

.section-placeholder p {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

/* Forms and Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: var(--radius-medium);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  gap: 8px;
  background: none;
  white-space: nowrap;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-purple), var(--primary-pink));
  color: var(--text-white);
  box-shadow: var(--shadow-light);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-medium);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid #E9ECEF;
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
  border-color: var(--primary-purple);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-sm {
  padding: 8px 16px;
  font-size: 0.8rem;
}

.btn-icon {
  background: none;
  border: none;
  padding: 8px;
  border-radius: var(--radius-small);
  cursor: pointer;
  transition: background var(--transition-fast);
  font-size: 1rem;
}

.btn-icon:hover {
  background: var(--bg-tertiary);
}

/* Form Controls */
.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E9ECEF;
  border-radius: var(--radius-medium);
  font-size: 0.9rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-purple);
  box-shadow: 0 0 0 3px rgba(138, 43, 226, 0.1);
}

.form-select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 16px 12px;
  padding-right: 40px;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.form-help {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 5px;
  font-style: italic;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-medium);
}

.modal-overlay.show {
  opacity: 1;
  visibility: visible;
}

.modal {
  background: var(--bg-secondary);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-heavy);
  max-width: 500px;
  width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  transform: scale(0.9);
  transition: transform var(--transition-medium);
}

.modal-overlay.show .modal {
  transform: scale(1);
}

.modal-header {
  padding: 25px 30px 20px;
  border-bottom: 1px solid #E9ECEF;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 30px;
}

.modal-footer {
  padding: 20px 30px 25px;
  border-top: 1px solid #E9ECEF;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

/* Tables */
.table-container {
  background: var(--bg-secondary);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-light);
  overflow: hidden;
}

.table-header {
  padding: 25px 30px;
  border-bottom: 1px solid #E9ECEF;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 15px 20px;
  text-align: left;
  border-bottom: 1px solid #F1F3F4;
}

.table th {
  background: var(--bg-tertiary);
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table tbody tr {
  transition: background var(--transition-fast);
}

.table tbody tr:hover {
  background: var(--bg-tertiary);
}

/* Animations */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Utility Classes */
.text-purple { color: var(--primary-purple); }
.text-pink { color: var(--primary-pink); }
.text-success { color: var(--success); }
.text-warning { color: var(--warning); }
.text-danger { color: var(--danger); }
.text-info { color: var(--info); }

.bg-purple { background: var(--primary-purple); }
.bg-pink { background: var(--primary-pink); }
.bg-gradient { background: linear-gradient(135deg, var(--primary-purple), var(--primary-pink)); }

.border-purple { border-color: var(--primary-purple); }
.border-pink { border-color: var(--primary-pink); }

.shadow-light { box-shadow: var(--shadow-light); }
.shadow-medium { box-shadow: var(--shadow-medium); }
.shadow-heavy { box-shadow: var(--shadow-heavy); }

.rounded-small { border-radius: var(--radius-small); }
.rounded-medium { border-radius: var(--radius-medium); }
.rounded-large { border-radius: var(--radius-large); }
.rounded-xl { border-radius: var(--radius-xl); }

/* ========================================
   DANCE STYLE MANAGEMENT - CRITICAL FIX
======================================== */

/* Management Controls */
.management-controls {
    display: grid !important;
    grid-template-columns: 1fr auto !important;
    gap: 20px !important;
    align-items: center !important;
    margin-bottom: 25px !important;
    padding: 20px !important;
    background: var(--bg-secondary) !important;
    border-radius: var(--radius-large) !important;
    box-shadow: var(--shadow-light) !important;
}

.search-section {
    display: flex !important;
    gap: 10px !important;
}

.quick-stats {
    display: flex !important;
    gap: 20px !important;
}

.quick-stat {
    text-align: center !important;
    padding: 15px 20px !important;
    background: var(--bg-secondary) !important;
    border-radius: var(--radius-medium) !important;
    min-width: 80px !important;
}

.stat-number {
    display: block !important;
    font-size: 1.5rem !important;
    font-weight: 700 !important;
    color: var(--primary-purple) !important;
}

.stat-label {
    font-size: 0.85rem !important;
    color: var(--text-secondary) !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
}

.styles-container {
    background: var(--bg-secondary) !important;
    border-radius: var(--radius-large) !important;
    padding: 25px !important;
    min-height: 200px !important;
}

.styles-grid {
    display: grid !important;
    gap: 20px !important;
}

/* DANCE STYLE CARDS - ABSOLUTE CRITICAL FIX */
.style-card {
    display: block !important;
    width: 100% !important;
    min-height: 300px !important;
    border: 2px solid #E9ECEF !important;
    border-radius: var(--radius-large) !important;
    background: var(--bg-primary) !important;
    transition: all var(--transition-fast) !important;
    overflow: hidden !important;
    padding: 20px !important;
    margin-bottom: 20px !important;
    box-sizing: border-box !important;
    position: relative !important;
}

.style-card:hover {
    border-color: var(--primary-purple) !important;
    box-shadow: var(--shadow-medium) !important;
    transform: translateY(-2px) !important;
}

.style-card-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    gap: 15px !important;
    margin-bottom: 15px !important;
}

.style-checkbox {
    margin-top: 5px !important;
    width: 16px !important;
    height: 16px !important;
}

.style-actions {
    display: flex !important;
    gap: 8px !important;
}

.featured-badge {
    background: linear-gradient(45deg, #FFD700, #FFA500) !important;
    color: white !important;
    padding: 4px 8px !important;
    border-radius: 12px !important;
    font-size: 0.8rem !important;
    font-weight: 600 !important;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3) !important;
}

.style-icon {
    width: 80px !important;
    height: 80px !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 2.5rem !important;
    color: white !important;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
    margin: 0 auto 15px !important;
    background: var(--primary-purple) !important;
}

.style-emoji {
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)) !important;
}

.style-info {
    text-align: center !important;
}

.style-name {
    font-size: 1.5rem !important;
    font-weight: 700 !important;
    color: var(--text-primary) !important;
    margin: 0 0 8px 0 !important;
}

.style-description {
    color: var(--text-secondary) !important;
    font-size: 0.95rem !important;
    line-height: 1.5 !important;
    margin: 0 0 15px 0 !important;
}

.style-meta {
    display: flex !important;
    justify-content: center !important;
    gap: 15px !important;
    margin-bottom: 15px !important;
    flex-wrap: wrap !important;
}

.difficulty-badge {
    padding: 4px 12px !important;
    border-radius: 20px !important;
    font-size: 0.8rem !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
}

.difficulty-beginner {
    background: rgba(40, 167, 69, 0.1) !important;
    color: #28A745 !important;
}

.difficulty-intermediate {
    background: rgba(255, 193, 7, 0.1) !important;
    color: #FFC107 !important;
}

.difficulty-advanced {
    background: rgba(255, 107, 53, 0.1) !important;
    color: #FF6B35 !important;
}

.difficulty-expert {
    background: rgba(220, 53, 69, 0.1) !important;
    color: #DC3545 !important;
}

.origin-badge {
    background: rgba(138, 43, 226, 0.1) !important;
    color: var(--primary-purple) !important;
    padding: 4px 12px !important;
    border-radius: 20px !important;
    font-size: 0.8rem !important;
    font-weight: 500 !important;
}

.style-popularity {
    margin-bottom: 15px !important;
}

.popularity-label {
    font-size: 0.85rem !important;
    color: var(--text-secondary) !important;
    margin-bottom: 5px !important;
}

.popularity-bar {
    height: 6px !important;
    background: #E9ECEF !important;
    border-radius: 3px !important;
    overflow: hidden !important;
    margin-bottom: 5px !important;
}

.popularity-fill {
    height: 100% !important;
    background: linear-gradient(90deg, var(--primary-purple), #FF69B4) !important;
    transition: width var(--transition-fast) !important;
}

.popularity-value {
    font-size: 0.8rem !important;
    color: var(--text-secondary) !important;
    text-align: right !important;
}

.style-stats {
    display: flex !important;
    justify-content: space-around !important;
    margin-bottom: 15px !important;
}

.stat {
    text-align: center !important;
}

.stat-icon {
    display: block !important;
    font-size: 1.2rem !important;
    margin-bottom: 5px !important;
}

.stat-label {
    display: block !important;
    font-size: 0.8rem !important;
    color: var(--text-secondary) !important;
    margin-bottom: 2px !important;
}

.stat-value {
    display: block !important;
    font-size: 1.1rem !important;
    font-weight: 600 !important;
    color: var(--text-primary) !important;
}

.music-genres {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 5px !important;
    justify-content: center !important;
}

.genre-tag {
    background: var(--bg-secondary) !important;
    color: var(--text-secondary) !important;
    padding: 3px 8px !important;
    border-radius: 12px !important;
    font-size: 0.75rem !important;
    font-weight: 500 !important;
}

.genre-more {
    background: var(--primary-purple) !important;
    color: white !important;
    padding: 3px 8px !important;
    border-radius: 12px !important;
    font-size: 0.75rem !important;
    font-weight: 600 !important;
}

/* Loading and Empty States */
.loading-state {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 15px !important;
    padding: 40px !important;
    color: var(--text-secondary) !important;
}

.loading-spinner {
    width: 40px !important;
    height: 40px !important;
    border: 4px solid #f3f3f3 !important;
    border-top: 4px solid var(--primary-purple) !important;
    border-radius: 50% !important;
    animation: spin 1s linear infinite !important;
}

.no-data {
    text-align: center !important;
    padding: 60px 20px !important;
}

.no-data-content {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 15px !important;
}

.no-data-icon {
    font-size: 4rem !important;
    opacity: 0.6 !important;
}

.no-data-text {
    font-size: 1.5rem !important;
    font-weight: 600 !important;
    color: var(--text-primary) !important;
}

.no-data-subtitle {
    font-size: 1rem !important;
    color: var(--text-secondary) !important;
    margin-bottom: 20px !important;
}

/* Section Header Styles */
.section-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    min-height: 60px !important;
    padding: 20px 0 !important;
    margin-bottom: 20px !important;
    border-bottom: 1px solid #E9ECEF !important;
}

.header-content {
    flex: 1 !important;
}

.header-content h1 {
    font-size: 2.2rem !important;
    color: var(--primary-purple) !important;
    margin: 0 0 5px 0 !important;
    font-weight: 700 !important;
}

.header-content p {
    color: var(--text-secondary) !important;
    margin: 0 !important;
    font-size: 1rem !important;
}

.header-actions {
    flex: none !important;
    display: flex !important;
    gap: 15px !important;
}

/* Message System */
.message-container {
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    z-index: 1050 !important;
}

.message {
    background: white !important;
    border-radius: var(--radius-medium) !important;
    padding: 15px 20px !important;
    margin-bottom: 10px !important;
    box-shadow: var(--shadow-medium) !important;
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    min-width: 300px !important;
    animation: slideInRight 0.3s ease !important;
}

.message-success {
    border-left: 4px solid var(--success) !important;
}

.message-error {
    border-left: 4px solid var(--danger) !important;
}

.message-warning {
    border-left: 4px solid var(--warning) !important;
}

.message-info {
    border-left: 4px solid var(--info) !important;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}