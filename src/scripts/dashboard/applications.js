// Applications Management
class ApplicationsManager {
    constructor() {
        this.applications = [];
        this.init();
    }

    init() {
        this.loadApplications();
    }

    // Load user applications
    loadApplications() {
        this.applications = JSON.parse(localStorage.getItem('userApplications') || '[]');
        this.renderApplications();
    }

    // Render applications to the container
    renderApplications() {
        const container = document.getElementById('applications-container');
        if (!container) return;

        if (this.applications.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-file-alt" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <h3>No Applications Yet</h3>
                    <p>Start applying to jobs to see your applications here!</p>
                    <button class="apply-btn" onclick="window.navigationManager.showSection('jobs')" style="margin-top: 1rem;">
                        <i class="fas fa-search"></i> Browse Jobs
                    </button>
                </div>
            `;
            return;
        }

        // Sort applications by date (newest first)
        const sortedApplications = [...this.applications].sort((a, b) => 
            new Date(b.appliedDate) - new Date(a.appliedDate)
        );

        container.innerHTML = sortedApplications.map(app => `
            <div class="job-card">
                <div class="job-header">
                    <div>
                        <div class="job-title">${app.jobTitle}</div>
                        <div class="job-company">${app.company}</div>
                    </div>
                    <span class="status-badge status-${app.status.toLowerCase().replace(/\s+/g, '-')}">${app.status}</span>
                </div>
                <div class="job-description">
                    ${app.description}
                    ${app.budget ? `<br><strong>Budget:</strong> ${app.budget}` : ''}
                </div>
                <div class="job-meta">
                    <span class="job-date">Applied: ${app.appliedDate}</span>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="apply-btn" onclick="window.applicationsManager.viewApplication(${app.id})">View Details</button>
                        ${app.status === 'Under Review' ? 
                            `<button class="apply-btn" style="background: #dc3545;" onclick="window.applicationsManager.withdrawApplication(${app.id})">Withdraw</button>` : 
                            ''
                        }
                    </div>
                </div>
            </div>
        `).join('');
    }

    // View application details
    viewApplication(applicationId) {
        const application = this.applications.find(app => app.id === applicationId);
        if (!application) {
            alert('Application not found.');
            return;
        }

        // Create a modal or detailed view
        const modalContent = `
            <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 600px; margin: 2rem auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <h2 style="color: #333; margin-bottom: 1rem;">Application Details</h2>
                <div style="margin-bottom: 1rem;">
                    <strong>Job Title:</strong> ${application.jobTitle}
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Company:</strong> ${application.company}
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Status:</strong> 
                    <span class="status-badge status-${application.status.toLowerCase().replace(/\s+/g, '-')}">${application.status}</span>
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Applied Date:</strong> ${application.appliedDate}
                </div>
                ${application.budget ? `
                    <div style="margin-bottom: 1rem;">
                        <strong>Budget:</strong> ${application.budget}
                    </div>
                ` : ''}
                <div style="margin-bottom: 1rem;">
                    <strong>Description:</strong><br>
                    ${application.description}
                </div>
                <button onclick="this.parentElement.remove()" class="apply-btn">Close</button>
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

    // Withdraw application
    withdrawApplication(applicationId) {
        if (!confirm('Are you sure you want to withdraw this application?')) {
            return;
        }

        const applicationIndex = this.applications.findIndex(app => app.id === applicationId);
        if (applicationIndex === -1) {
            alert('Application not found.');
            return;
        }

        // Remove application
        this.applications.splice(applicationIndex, 1);
        localStorage.setItem('userApplications', JSON.stringify(this.applications));
        
        alert('Application withdrawn successfully.');
        
        // Refresh the display
        this.renderApplications();
        
        // Update dashboard stats
        if (window.dashboardOverviewManager) {
            window.dashboardOverviewManager.updateStats();
        }
    }

    // Add new application (called from jobs section)
    addApplication(applicationData) {
        this.applications.push(applicationData);
        localStorage.setItem('userApplications', JSON.stringify(this.applications));
        
        // If currently viewing applications, refresh
        if (window.navigationManager && window.navigationManager.getCurrentSection() === 'applications') {
            this.renderApplications();
        }
    }

    // Update application status
    updateApplicationStatus(applicationId, newStatus, description = '') {
        const application = this.applications.find(app => app.id === applicationId);
        if (application) {
            application.status = newStatus;
            if (description) {
                application.description = description;
            }
            localStorage.setItem('userApplications', JSON.stringify(this.applications));
            this.renderApplications();
        }
    }

    // Get applications by status
    getApplicationsByStatus(status) {
        return this.applications.filter(app => app.status === status);
    }

    // Get application statistics
    getApplicationStats() {
        const total = this.applications.length;
        const pending = this.applications.filter(app => app.status === 'Under Review').length;
        const accepted = this.applications.filter(app => app.status === 'Accepted').length;
        const rejected = this.applications.filter(app => app.status === 'Rejected').length;
        const interview = this.applications.filter(app => app.status === 'Interview Scheduled').length;

        return {
            total,
            pending,
            accepted,
            rejected,
            interview,
            successRate: total > 0 ? Math.round((accepted / total) * 100) : 0
        };
    }

    // Refresh applications (for external calls)
    refreshApplications() {
        this.loadApplications();
    }
}

// Create global applications manager instance
window.applicationsManager = new ApplicationsManager();