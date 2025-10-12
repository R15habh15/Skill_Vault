// Dashboard Overview Management
class DashboardOverviewManager {
    constructor() {
        this.stats = {
            profileViews: 0,
            activeProposals: 0,
            averageRating: 4.8,
            successRate: 95
        };
        this.init();
    }

    init() {
        this.loadRecentJobs();
        this.updateStats();
    }

    // Load recent job matches for dashboard
    loadRecentJobs() {
        const container = document.getElementById('recent-jobs-container');
        if (!container) return;

        // Show empty state for new users
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-briefcase" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3>No Job Matches Yet</h3>
                <p>Complete your profile to get personalized job recommendations</p>
                <button onclick="showSection('profile')" class="apply-btn" style="margin-top: 1rem;">
                    <i class="fas fa-user-edit"></i> Complete Profile
                </button>
            </div>
        `;
    }

    // Update dashboard statistics (removed - no stats cards to update)
    updateStats() {
        // Stats cards have been removed from the dashboard
        // This function is kept for compatibility but does nothing
    }

    // Refresh dashboard data
    refresh() {
        this.loadRecentJobs();
        this.updateStats();
    }

    // Get current stats
    getStats() {
        return this.stats;
    }
}

// Apply to job function (called from job cards)
function applyToJob(jobId) {
    const userInfo = authManager.getCurrentUser();
    
    if (!userInfo || !userInfo.id) {
        alert('Please log in to apply for jobs.');
        return;
    }

    // Simulate application submission
    const applications = JSON.parse(localStorage.getItem('userApplications') || '[]');
    const newApplication = {
        id: Date.now(),
        jobId: jobId,
        jobTitle: "Applied Job " + jobId,
        company: "Company Name",
        status: "Under Review",
        description: "Your application has been submitted successfully.",
        appliedDate: new Date().toLocaleDateString()
    };
    
    applications.push(newApplication);
    localStorage.setItem('userApplications', JSON.stringify(applications));
    
    alert('Application submitted successfully!');
    
    // Update dashboard stats
    if (window.dashboardOverviewManager) {
        window.dashboardOverviewManager.updateStats();
    }
    
    // Refresh applications if on that section
    if (navigationManager.getCurrentSection() === 'applications' && window.applicationsManager) {
        window.applicationsManager.refreshApplications();
    }
}

// Communicate function (placeholder for future implementation)
function openCommunicateModal() {
    // Create communication modal
    const modalContent = `
        <div style="background: white; padding: 2rem; border-radius: 20px; max-width: 600px; margin: 2rem auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <h2 style="color: #333; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-comments" style="color: #667eea;"></i>
                Communication Center
            </h2>
            
            <div style="display: grid; gap: 1rem; margin-bottom: 2rem;">
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; border-left: 4px solid #667eea;">
                    <h4 style="color: #333; margin-bottom: 0.5rem;">
                        <i class="fas fa-envelope" style="color: #667eea; margin-right: 0.5rem;"></i>
                        Messages
                    </h4>
                    <p style="color: #666; margin: 0;">Chat with clients and view your message history</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; border-left: 4px solid #28a745;">
                    <h4 style="color: #333; margin-bottom: 0.5rem;">
                        <i class="fas fa-users" style="color: #28a745; margin-right: 0.5rem;"></i>
                        Team Chat
                    </h4>
                    <p style="color: #666; margin: 0;">Collaborate with project team members</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; border-left: 4px solid #ffc107;">
                    <h4 style="color: #333; margin-bottom: 0.5rem;">
                        <i class="fas fa-bell" style="color: #ffc107; margin-right: 0.5rem;"></i>
                        Notifications
                    </h4>
                    <p style="color: #666; margin: 0;">View important updates and alerts</p>
                </div>
            </div>
            
            <div style="text-align: center; color: #666; margin-bottom: 2rem;">
                <i class="fas fa-tools" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <p>Communication features will be available soon!</p>
            </div>
            
            <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" class="apply-btn">Close</button>
        </div>
    `;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    overlay.innerHTML = modalContent;
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });

    document.body.appendChild(overlay);
}

// Video Call History function (placeholder for future implementation)
function openVideoCallHistory() {
    // Create video call history modal
    const modalContent = `
        <div style="background: white; padding: 2rem; border-radius: 20px; max-width: 700px; margin: 2rem auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-height: 80vh; overflow-y: auto;">
            <h2 style="color: #333; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-video" style="color: #667eea;"></i>
                Video Call History
            </h2>
            
            <div style="margin-bottom: 2rem;">
                <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                    <button class="apply-btn" style="background: #28a745; font-size: 0.9rem; padding: 0.5rem 1rem;">
                        <i class="fas fa-video"></i> Start New Call
                    </button>
                    <button class="apply-btn" style="background: #667eea; font-size: 0.9rem; padding: 0.5rem 1rem;">
                        <i class="fas fa-calendar"></i> Schedule Meeting
                    </button>
                </div>
            </div>
            
            <div style="text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-video-slash" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <h3 style="color: #333; margin-bottom: 0.5rem;">No Call History</h3>
                <p>Your video call history will appear here once you start having meetings with clients.</p>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 10px; margin-top: 1.5rem; text-align: left;">
                    <h4 style="color: #333; margin-bottom: 0.5rem;">Coming Soon:</h4>
                    <ul style="color: #666; margin: 0; padding-left: 1.5rem;">
                        <li>Video calls with clients</li>
                        <li>Screen sharing capabilities</li>
                        <li>Meeting recordings</li>
                        <li>Calendar integration</li>
                        <li>Call history and notes</li>
                    </ul>
                </div>
            </div>
            
            <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" class="apply-btn">Close</button>
        </div>
    `;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    overlay.innerHTML = modalContent;
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });

    document.body.appendChild(overlay);
}

// Create global dashboard overview manager instance
window.dashboardOverviewManager = new DashboardOverviewManager();