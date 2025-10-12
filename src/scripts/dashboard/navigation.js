// Navigation Management
class NavigationManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add click handlers for navigation menu items
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('onclick')?.match(/showSection\('(.+?)'\)/)?.[1];
                if (sectionId) {
                    this.showSection(sectionId);
                }
            });
        });

        // Add click handlers for quick action cards
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = card.getAttribute('onclick')?.match(/showSection\('(.+?)'\)/)?.[1];
                if (sectionId) {
                    this.showSection(sectionId);
                }
            });
        });
    }

    // Navigation function for sidebar menu
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Trigger section-specific loading if needed
            this.onSectionChange(sectionId);
        }
        
        // Update active menu item
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Find and activate the clicked menu item
        const activeLink = document.querySelector(`[onclick*="showSection('${sectionId}')"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Handle section-specific actions when switching
    onSectionChange(sectionId) {
        switch(sectionId) {
            case 'jobs':
                if (window.jobsManager) {
                    window.jobsManager.refreshJobs();
                }
                break;
            case 'applications':
                if (window.applicationsManager) {
                    window.applicationsManager.refreshApplications();
                }
                break;
            case 'proposals':
                if (window.proposalsManager) {
                    window.proposalsManager.refreshProposals();
                }
                break;
            case 'projects':
                if (window.activeProjectsManager) {
                    window.activeProjectsManager.refreshProjects();
                }
                break;
            case 'past-projects':
                if (window.pastProjectsManager) {
                    window.pastProjectsManager.refreshProjects();
                }
                break;
            case 'credits':
                if (window.creditsManager) {
                    window.creditsManager.refreshCredits();
                }
                break;
            case 'profile':
                if (window.profileManager) {
                    window.profileManager.loadProfileData();
                }
                break;
        }
    }

    // Get current active section
    getCurrentSection() {
        return this.currentSection;
    }

    // Navigate to specific section programmatically
    navigateTo(sectionId) {
        this.showSection(sectionId);
    }
}

// Global navigation function (for backward compatibility)
function showSection(sectionId) {
    if (window.navigationManager) {
        window.navigationManager.showSection(sectionId);
    }
}

// Create global navigation manager instance
window.navigationManager = new NavigationManager();