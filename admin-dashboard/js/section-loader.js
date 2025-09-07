// 🔧 Initialize section-specific functionality - COMPLETELY FIXED
async initializeSectionFunctionality(sectionName) {
    try {
        console.log(`🔧 Initializing section functionality: ${sectionName}`);
        
        // Track initialization attempts
        const attempts = this.initializationAttempts.get(sectionName) || 0;
        if (attempts >= this.maxAttempts) {
            console.warn(`⚠️ Max initialization attempts reached for ${sectionName}`);
            return;
        }
        
        this.initializationAttempts.set(sectionName, attempts + 1);
        
        // Initialize based on section type
        switch (sectionName) {
            case 'dashboard':
                if (window.DancifyDashboard && window.apiClient) {
                    if (!window.dashboardManager) {
                        console.log('📊 Creating Dashboard instance...');
                        window.dashboardManager = new window.DancifyDashboard(window.apiClient);
                    }
                    if (typeof window.dashboardManager.init === 'function') {
                        await window.dashboardManager.init();
                        console.log('✅ Dashboard initialized successfully');
                    }
                }
                break;
                
            case 'move-management':
                // FIXED: Proper MoveManager initialization
                console.log('🕺 Initializing Move Management...');
                
                // Check if we have the required classes
                if (!window.MoveManager) {
                    console.error('❌ MoveManager class not found');
                    throw new Error('MoveManager class not available');
                }
                
                if (!window.apiClient) {
                    console.error('❌ API client not found');
                    throw new Error('API client not available');
                }
                
                // Create MoveManager instance if it doesn't exist
                if (!window.moveManager) {
                    console.log('🕺 Creating MoveManager instance...');
                    window.moveManager = new window.MoveManager(window.apiClient);
                    console.log('✅ MoveManager instance created');
                }
                
                // Initialize the move manager
                if (typeof window.moveManager.init === 'function') {
                    console.log('🕺 Calling MoveManager.init()...');
                    await window.moveManager.init();
                    console.log('✅ MoveManager initialized successfully');
                } else {
                    console.error('❌ MoveManager.init() method not found');
                }
                break;
                
            case 'dance-style-management':
                if (window.DanceStyleManager && window.apiClient) {
                    if (!window.styleManager) {
                        window.styleManager = new window.DanceStyleManager(window.apiClient);
                    }
                    if (typeof window.styleManager.init === 'function') {
                        await window.styleManager.init();
                    }
                }
                break;
                
            case 'move-submissions':
                if (window.SubmissionManager && window.apiClient) {
                    if (!window.submissionManager) {
                        window.submissionManager = new window.SubmissionManager(window.apiClient);
                    }
                    if (typeof window.submissionManager.init === 'function') {
                        await window.submissionManager.init();
                    }
                }
                break;
                
            case 'users':
                if (window.UserManager && window.apiClient) {
                    if (!window.userManager) {
                        window.userManager = new window.UserManager(window.apiClient);
                    }
                    if (typeof window.userManager.init === 'function') {
                        await window.userManager.init();
                    }
                }
                break;
                
            default:
                console.log(`ℹ️ No specific initialization for section: ${sectionName}`);
                break;
        }
        
        console.log(`✅ Section functionality initialized: ${sectionName}`);
        
    } catch (error) {
        console.error(`❌ Failed to initialize section functionality for ${sectionName}:`, error);
        // Show error message to user
        this.showSectionError(sectionName, `Failed to initialize: ${error.message}`);
        throw error; // Re-throw to prevent section from appearing to load successfully
    }
}