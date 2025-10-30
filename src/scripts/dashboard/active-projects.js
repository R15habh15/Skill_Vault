// Active Projects Management for both Company and Freelancer
// Enhanced with Work Submission Integration

class ActiveProjectsManager {
    constructor() {
        this.userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (this.userInfo) {
            this.init();
        }
    }

    init() {
        this.loadActiveProjects();

        // Refresh every 30 seconds
        setInterval(() => this.loadActiveProjects(), 30000);
    }

    // Alias for compatibility
    refreshProjects() {
        return this.loadActiveProjects();
    }

    async loadActiveProjects() {
        if (!this.userInfo) return;

        const container = document.getElementById('active-projects-container');
        if (!container) return;

        try {
            const response = await fetch(
                `/api/jobs/projects/user/${this.userInfo.id}?userType=${this.userInfo.user_type}`
            );
            const data = await response.json();

            if (data.success) {
                this.displayProjects(data.projects, container);
            }
        } catch (err) {
            console.error('Error loading active projects:', err);
            container.innerHTML = '<p style="text-align: center; color: #666;">Failed to load projects</p>';
        }
    }

    displayProjects(projects, container) {
        if (projects.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No active projects yet</p>
                </div>
            `;
            return;
        }

        const isCompany = this.userInfo.user_type === 'company';

        container.innerHTML = projects.map(project => `
            <div class="project-card" style="background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <h3 style="margin-bottom: 0.5rem; color: #333;">${project.title || project.project_title || 'Untitled Project'}</h3>
                        <p style="color: #667eea; font-size: 0.9rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-${isCompany ? 'user' : 'building'}"></i> 
                            ${isCompany ? project.freelancer_name : project.company_name}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <span class="badge" style="background: ${this.getStatusColor(project.status)}; color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem;">
                            ${this.formatStatus(project.status)}
                        </span>
                    </div>
                </div>

                ${(project.description || project.project_description) ? `
                    <p style="color: #666; margin-bottom: 1rem; line-height: 1.6;">
                        ${(project.description || project.project_description).substring(0, 150)}${(project.description || project.project_description).length > 150 ? '...' : ''}
                    </p>
                ` : ''}

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <div>
                        <div style="font-size: 0.85rem; color: #666;">Budget</div>
                        <div style="font-size: 1.1rem; font-weight: bold; color: #667eea;">${project.budget_amount} VCreds</div>
                    </div>
                    ${project.agreed_rate ? `
                        <div>
                            <div style="font-size: 0.85rem; color: #666;">Agreed Rate</div>
                            <div style="font-size: 1.1rem; font-weight: bold; color: #28a745;">${project.agreed_rate} VCreds</div>
                        </div>
                    ` : ''}
                    ${project.agreed_timeline ? `
                        <div>
                            <div style="font-size: 0.85rem; color: #666;">Timeline</div>
                            <div style="font-size: 1rem; font-weight: 600;">${project.agreed_timeline}</div>
                        </div>
                    ` : ''}
                    <div>
                        <div style="font-size: 0.85rem; color: #666;">Progress</div>
                        <div style="font-size: 1rem; font-weight: 600;">${project.progress_percentage}%</div>
                    </div>
                </div>

                <div style="margin-bottom: 1rem;">
                    <div style="background: #e9ecef; height: 8px; border-radius: 10px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: ${project.progress_percentage}%; transition: width 0.3s;"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 0.5rem; font-size: 0.85rem; color: #666; margin-bottom: 1rem;">
                    <span><i class="fas fa-calendar-plus"></i> Started: ${new Date(project.start_date).toLocaleDateString()}</span>
                    ${project.deadline ? `<span><i class="fas fa-calendar-check"></i> Deadline: ${new Date(project.deadline).toLocaleDateString()}</span>` : ''}
                </div>

                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${!isCompany && (project.status === 'active' || project.status === 'in_progress' || project.status === 'under_review') ? `
                        <button onclick="workSubmissionManager.showSubmitWorkModal(${project.id}, '${(project.title || project.project_title || 'Project').replace(/'/g, "\\'")}' )" class="apply-btn" style="background: #28a745; font-size: 0.9rem;">
                            <i class="fas fa-upload"></i> Submit Work
                        </button>
                    ` : ''}
                    
                    <button onclick="workSubmissionManager.viewSubmissions(${project.id})" class="apply-btn" style="background: #17a2b8; font-size: 0.9rem;">
                        <i class="fas fa-file-alt"></i> View Submissions
                    </button>

                    ${isCompany && project.status === 'under_review' ? `
                        <button class="apply-btn" style="background: #ffc107; font-size: 0.9rem; cursor: default;">
                            <i class="fas fa-clock"></i> Awaiting Your Review
                        </button>
                    ` : ''}
                    
                    <button onclick="activeProjectsManager.viewProjectDetails(${project.id})" class="apply-btn" style="background: #667eea; font-size: 0.9rem;">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    getStatusColor(status) {
        const colors = {
            active: '#17a2b8',
            in_progress: '#ffc107',
            under_review: '#ff6b6b',
            completed: '#28a745',
            cancelled: '#dc3545',
            on_hold: '#6c757d'
        };
        return colors[status] || '#6c757d';
    }

    formatStatus(status) {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    viewProjectDetails(projectId) {
        alert('Project details view - Coming soon!\nProject ID: ' + projectId);
        // TODO: Implement detailed project view modal
    }

    async updateProgress(projectId, currentProgress) {
        const newProgress = prompt(`Update project progress (0-100):\nCurrent: ${currentProgress}%`, currentProgress);

        if (newProgress === null) return;

        const progress = parseInt(newProgress);
        if (isNaN(progress) || progress < 0 || progress > 100) {
            alert('Please enter a valid progress percentage (0-100)');
            return;
        }

        try {
            const response = await fetch(`/api/jobs/projects/${projectId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ progressPercentage: progress })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                alert('Progress updated successfully!');
                this.loadActiveProjects();
            } else {
                alert(data.message || 'Failed to update progress');
            }
        } catch (err) {
            console.error('Error updating progress:', err);
            alert('Failed to update progress. Please try again.');
        }
    }

    async markInProgress(projectId) {
        if (!confirm('Mark this project as "In Progress"?')) return;

        try {
            const response = await fetch(`/api/jobs/projects/${projectId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'in_progress' })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                alert('Project marked as in progress!');
                this.loadActiveProjects();
            } else {
                alert(data.message || 'Failed to update project status');
            }
        } catch (err) {
            console.error('Error updating project:', err);
            alert('Failed to update project status. Please try again.');
        }
    }

    async markCompleted(projectId) {
        if (!confirm('Mark this project as completed? This action cannot be undone.')) return;

        try {
            const response = await fetch(`/api/jobs/projects/${projectId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                alert('Project marked as completed! 🎉');
                this.loadActiveProjects();
            } else {
                alert(data.message || 'Failed to complete project');
            }
        } catch (err) {
            console.error('Error completing project:', err);
            alert('Failed to complete project. Please try again.');
        }
    }
}

// Initialize when DOM is ready
let activeProjectsManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        activeProjectsManager = new ActiveProjectsManager();
        window.activeProjectsManager = activeProjectsManager;
    });
} else {
    activeProjectsManager = new ActiveProjectsManager();
    window.activeProjectsManager = activeProjectsManager;
}

