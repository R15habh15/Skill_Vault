// Main Dashboard Initialization
class DashboardMain {
    constructor() {
        this.initialized = false;
        this.managers = {};
        this.init();
    }

    async init() {
        if (this.initialized) return;

        console.log('🚀 Initializing Skill Vault Dashboard...');

        try {
            // Check user access first
            if (!authManager.checkUserAccess()) {
                return; // Will redirect if access denied
            }

            // Load user data
            authManager.loadUserData();

            // Initialize all managers
            await this.initializeManagers();

            // Setup global event listeners
            this.setupGlobalEventListeners();

            // Initialize dynamic content after a short delay
            setTimeout(() => {
                this.initializeDynamicContent();
            }, 500);

            // Add interactive effects
            this.addInteractiveEffects();

            // Setup search and filter functionality
            this.setupSearchFilters();

            // Mark as initialized
            this.initialized = true;

            console.log('✅ Dashboard initialized successfully');

        } catch (error) {
            console.error('❌ Error initializing dashboard:', error);
            this.showErrorMessage('Failed to initialize dashboard. Please refresh the page.');
        }
    }

    async initializeManagers() {
        // Store manager references
        this.managers = {
            auth: window.authManager,
            navigation: window.navigationManager,
            dashboardOverview: window.dashboardOverviewManager,
            jobs: window.jobsManager,
            applications: window.applicationsManager,
            proposals: window.proposalsManager,
            activeProjects: window.activeProjectsManager,
            pastProjects: window.pastProjectsManager,
            credits: window.creditsManager,
            profile: window.profileManager,
            settings: window.settingsManager,
            notifications: window.notificationsManager
        };

        console.log('📋 All managers initialized');
    }

    setupGlobalEventListeners() {
        // Handle form submissions globally
        document.addEventListener('submit', (e) => {
            if (e.target && e.target.tagName === 'FORM' && !e.target.hasAttribute('data-no-prevent')) {
                e.preventDefault();
                console.log('Form submission intercepted:', e.target.id);
            }
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshCurrentSection();
            }
        });

        console.log('⌨️ Global event listeners setup complete');
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.focusSearch();
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            this.closeModals();
        }

        // Number keys for quick navigation (1-9)
        if (e.altKey && e.key >= '1' && e.key <= '9') {
            e.preventDefault();
            this.quickNavigate(parseInt(e.key));
        }
    }

    focusSearch() {
        const searchInput = document.querySelector('.search-input:not([style*="display: none"])');
        if (searchInput) {
            searchInput.focus();
        }
    }

    closeModals() {
        const modals = document.querySelectorAll('[style*="position: fixed"][style*="z-index"]');
        modals.forEach(modal => {
            if (modal.style.zIndex >= 1000) {
                modal.remove();
            }
        });
    }

    quickNavigate(number) {
        const sections = ['dashboard', 'jobs', 'applications', 'proposals', 'projects', 'past-projects', 'credits', 'profile', 'settings'];
        if (number <= sections.length) {
            this.managers.navigation.showSection(sections[number - 1]);
        }
    }

    handleWindowResize() {
        // Handle responsive adjustments
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (window.innerWidth <= 1024) {
            // Mobile/tablet adjustments
            if (sidebar) sidebar.style.position = 'relative';
        } else {
            // Desktop adjustments
            if (sidebar) sidebar.style.position = 'sticky';
        }
    }

    initializeDynamicContent() {
        // Load content for all sections
        if (this.managers.dashboardOverview) {
            this.managers.dashboardOverview.refresh();
        }

        // Add profile completion widget if on profile section
        if (this.managers.profile) {
            setTimeout(() => {
                this.managers.profile.addProfileCompletionWidget();
            }, 1000);
        }

        console.log('📊 Dynamic content initialized');
    }

    addInteractiveEffects() {
        // Add hover effects to job cards
        document.addEventListener('mouseenter', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('job-card')) {
                e.target.style.transform = 'translateY(-2px)';
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('job-card')) {
                e.target.style.transform = 'translateY(0)';
            }
        }, true);

        // Add loading states to buttons
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('apply-btn')) {
                this.addButtonLoadingState(e.target);
            }
        });

        console.log('✨ Interactive effects added');
    }

    addButtonLoadingState(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        button.disabled = true;

        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        }, 1000);
    }

    setupSearchFilters() {
        // Enhanced search functionality
        document.addEventListener('input', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('search-input')) {
                this.handleSearch(e.target);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('filter-select')) {
                this.handleFilter(e.target);
            }
        });

        console.log('🔍 Search and filter functionality setup');
    }

    handleSearch(input) {
        const searchTerm = input.value.toLowerCase();
        const section = input.closest('.content-section').id;
        
        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch(section, searchTerm);
        }, 300);
    }

    handleFilter(select) {
        const filterValue = select.value;
        const section = select.closest('.content-section').id;
        this.performFilter(section, filterValue);
    }

    performSearch(section, searchTerm) {
        switch (section) {
            case 'jobs':
                if (this.managers.jobs) {
                    this.managers.jobs.currentSearch = searchTerm;
                    this.managers.jobs.filterJobs();
                }
                break;
            case 'past-projects':
                if (this.managers.pastProjects) {
                    this.managers.pastProjects.currentSearch = searchTerm;
                    this.managers.pastProjects.filterProjects();
                }
                break;
        }
    }

    performFilter(section, filterValue) {
        switch (section) {
            case 'jobs':
                if (this.managers.jobs) {
                    this.managers.jobs.currentFilter = filterValue;
                    this.managers.jobs.filterJobs();
                }
                break;
            case 'past-projects':
                if (this.managers.pastProjects) {
                    this.managers.pastProjects.currentFilter = filterValue;
                    this.managers.pastProjects.filterProjects();
                }
                break;
        }
    }

    refreshCurrentSection() {
        const currentSection = this.managers.navigation?.getCurrentSection();
        if (!currentSection) return;

        // Refresh data for current section
        switch (currentSection) {
            case 'dashboard':
                this.managers.dashboardOverview?.refresh();
                break;
            case 'jobs':
                this.managers.jobs?.refreshJobs();
                break;
            case 'applications':
                this.managers.applications?.refreshApplications();
                break;
            case 'proposals':
                this.managers.proposals?.refreshProposals();
                break;
            case 'projects':
                this.managers.activeProjects?.refreshProjects();
                break;
            case 'past-projects':
                this.managers.pastProjects?.refreshProjects();
                break;
            case 'credits':
                this.managers.credits?.refreshCredits();
                break;
            case 'profile':
                this.managers.profile?.loadProfileData();
                break;
        }
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #dc3545;
            color: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
            max-width: 400px;
        `;
        
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <h3 style="margin-bottom: 1rem;">Error</h3>
            <p style="margin-bottom: 1rem;">${message}</p>
            <button onclick="this.parentElement.remove(); location.reload();" style="background: white; color: #dc3545; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">
                Reload Page
            </button>
        `;

        document.body.appendChild(errorDiv);
    }

    // Public methods for external access
    getManager(name) {
        return this.managers[name];
    }

    isInitialized() {
        return this.initialized;
    }

    // Utility method to show notifications
    showNotification(message, type = 'info', duration = 3000) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            font-weight: 500;
            max-width: 350px;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM loaded, initializing dashboard...');
    
    // Create global dashboard instance
    window.dashboardMain = new DashboardMain();
    
    // Add CSS animations for notifications if not already present
    if (!document.getElementById('dashboard-animations')) {
        const style = document.createElement('style');
        style.id = 'dashboard-animations';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
});

// Global utility functions for backward compatibility
function showSection(sectionId) {
    if (window.navigationManager) {
        window.navigationManager.showSection(sectionId);
    }
}

function applyToJob(jobId) {
    if (window.jobsManager) {
        window.jobsManager.applyToJob(jobId);
    }
}

function logout() {
    if (window.authManager) {
        // Use the auth manager's logout method if available
        const authManager = window.authManager;
        
        // Clear user data
        localStorage.removeItem('userInfo');
        localStorage.removeItem('userCredits');
        localStorage.removeItem('freelancerTransactions');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('userApplications');
        localStorage.removeItem('userProposals');
        localStorage.removeItem('userActiveProjects');
        localStorage.removeItem('userPastProjects');
        localStorage.removeItem('userEarnings');
        localStorage.removeItem('userTransactions');
        
        // Show logout message
        alert('You have been logged out successfully!');
        
        // Redirect to home page
        window.location.href = '/';
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardMain };
}