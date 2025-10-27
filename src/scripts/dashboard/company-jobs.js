// Company Job Posting Management

class CompanyJobManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupJobPostForm();
        this.loadCompanyJobs();
        this.setupFilters();
        this.loadAllApplications();
    }

    setupFilters() {
        const statusFilter = document.getElementById('job-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.loadCompanyJobs());
        }

        const appFilter = document.getElementById('application-filter');
        if (appFilter) {
            appFilter.addEventListener('change', () => this.loadAllApplications());
        }
    }

    async loadAllApplications() {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo) return;

        const container = document.getElementById('applications-list');
        if (!container) return;

        try {
            // Get all company jobs first
            const jobsResponse = await fetch(`/api/jobs/company/${userInfo.id}`);
            const jobsData = await jobsResponse.json();

            if (!jobsData.success || jobsData.jobs.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No jobs posted yet. Post a job to receive applications.</p>';
                return;
            }

            // Get applications for all jobs
            const allApplications = [];
            for (const job of jobsData.jobs) {
                const appResponse = await fetch(`/api/jobs/${job.id}/applications`);
                const appData = await appResponse.json();
                if (appData.success && appData.applications.length > 0) {
                    appData.applications.forEach(app => {
                        app.job_title = job.title;
                        app.job_id = job.id;
                        allApplications.push(app);
                    });
                }
            }

            const filter = document.getElementById('application-filter')?.value || 'all';
            const filteredApps = filter === 'all' 
                ? allApplications 
                : allApplications.filter(app => app.status === filter);

            this.displayAllApplications(filteredApps, container);
        } catch (err) {
            console.error('Error loading applications:', err);
            container.innerHTML = '<p style="text-align: center; color: #666;">Failed to load applications</p>';
        }
    }

    displayAllApplications(applications, container) {
        if (applications.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No applications received yet.</p>';
            return;
        }

        container.innerHTML = applications.map(app => `
            <div style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h4 style="margin-bottom: 0.5rem;">${app.freelancer_name}</h4>
                        <p style="color: #667eea; font-size: 0.9rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-envelope"></i> ${app.freelancer_email}
                        </p>
                        <p style="color: #666; font-size: 0.9rem;">
                            <i class="fas fa-briefcase"></i> Applied for: <strong>${app.job_title}</strong>
                        </p>
                    </div>
                    <span class="badge" style="background: ${this.getApplicationStatusColor(app.status)}; color: white; padding: 0.5rem 1rem; border-radius: 20px;">${app.status}</span>
                </div>
                
                ${app.cover_letter ? `
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <strong style="display: block; margin-bottom: 0.5rem;">Cover Letter:</strong>
                        <p style="color: #666; line-height: 1.6; margin: 0;">${app.cover_letter}</p>
                    </div>
                ` : ''}
                
                <div style="display: flex; gap: 1.5rem; margin-bottom: 1rem; font-size: 0.9rem; color: #666;">
                    ${app.proposed_rate ? `<span><i class="fas fa-coins"></i> <strong>${app.proposed_rate} VCreds</strong></span>` : ''}
                    ${app.proposed_timeline ? `<span><i class="fas fa-clock"></i> ${app.proposed_timeline}</span>` : ''}
                    <span><i class="fas fa-calendar"></i> ${new Date(app.applied_at).toLocaleDateString()}</span>
                </div>
                
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="companyJobManager.updateApplicationStatus(${app.id}, 'reviewed')" class="apply-btn" style="background: #17a2b8; font-size: 0.9rem;">
                        <i class="fas fa-eye"></i> Mark Reviewed
                    </button>
                    <button onclick="companyJobManager.updateApplicationStatus(${app.id}, 'shortlisted')" class="apply-btn" style="background: #ffc107; font-size: 0.9rem;">
                        <i class="fas fa-star"></i> Shortlist
                    </button>
                    <button onclick="companyJobManager.updateApplicationStatus(${app.id}, 'accepted')" class="apply-btn" style="background: #28a745; font-size: 0.9rem;">
                        <i class="fas fa-check"></i> Accept
                    </button>
                    <button onclick="companyJobManager.updateApplicationStatus(${app.id}, 'rejected')" class="apply-btn" style="background: #dc3545; font-size: 0.9rem;">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button onclick="companyJobManager.viewJobApplications(${app.job_id})" class="apply-btn" style="background: #6c757d; font-size: 0.9rem;">
                        <i class="fas fa-briefcase"></i> View Job
                    </button>
                </div>
            </div>
        `).join('');
    }

    viewJobApplications(jobId) {
        this.viewApplications(jobId);
    }

    setupJobPostForm() {
        const form = document.getElementById('job-post-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.postJob();
        });
    }

    async postJob() {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo) {
            alert('Please login to post a job');
            return;
        }

        const jobData = {
            companyId: userInfo.id,
            title: document.getElementById('job-title').value,
            description: document.getElementById('job-description').value,
            category: document.getElementById('job-category').value,
            duration: document.getElementById('job-duration').value,
            budgetType: document.getElementById('budget-type').value,
            budgetAmount: parseInt(document.getElementById('budget-amount').value),
            requiredSkills: document.getElementById('required-skills').value,
            experienceLevel: document.getElementById('experience-level').value
        };

        try {
            const response = await fetch('/api/jobs/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobData)
            });

            const data = await response.json();

            if (data.success) {
                alert('Job posted successfully!');
                document.getElementById('job-post-form').reset();
                this.loadCompanyJobs();
                showSection('job-listings');
            } else {
                alert('Failed to post job: ' + data.message);
            }
        } catch (err) {
            console.error('Error posting job:', err);
            alert('Failed to post job. Please try again.');
        }
    }

    async loadCompanyJobs() {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo) return;

        const container = document.getElementById('company-jobs-list');
        if (!container) return;

        const filter = document.getElementById('job-status-filter')?.value || 'all';

        try {
            const response = await fetch(`/api/jobs/company/${userInfo.id}?status=${filter}`);
            const data = await response.json();

            if (data.success) {
                this.displayJobs(data.jobs, container);
            }
        } catch (err) {
            console.error('Error loading jobs:', err);
            container.innerHTML = '<p>Failed to load jobs</p>';
        }
    }

    displayJobs(jobs, container) {
        if (jobs.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No jobs found</p>';
            return;
        }

        container.innerHTML = jobs.map(job => `
            <div class="job-card" style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin-bottom: 0.5rem;">${job.title}</h3>
                        <span class="badge" style="background: ${this.getStatusColor(job.status)}; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem;">${job.status}</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.25rem; font-weight: bold; color: #667eea;">${job.budget_amount} VCreds</div>
                        <div style="font-size: 0.85rem; color: #666;">${job.budget_type}</div>
                    </div>
                </div>
                <p style="color: #666; margin-bottom: 1rem;">${job.description.substring(0, 150)}...</p>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
                    <span><i class="fas fa-tag"></i> ${job.category}</span>
                    <span><i class="fas fa-clock"></i> ${job.duration}</span>
                    <span><i class="fas fa-chart-line"></i> ${job.experience_level}</span>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="companyJobManager.viewApplications(${job.id})" class="apply-btn" style="background: #667eea;">
                        <i class="fas fa-users"></i> View Applications
                    </button>
                    ${job.status === 'active' ? `
                        <button onclick="companyJobManager.pauseJob(${job.id})" class="apply-btn" style="background: #ffc107;">
                            <i class="fas fa-pause"></i> Pause
                        </button>
                    ` : ''}
                    ${job.status === 'paused' ? `
                        <button onclick="companyJobManager.activateJob(${job.id})" class="apply-btn" style="background: #28a745;">
                            <i class="fas fa-play"></i> Activate
                        </button>
                    ` : ''}
                    <button onclick="companyJobManager.closeJob(${job.id})" class="apply-btn" style="background: #dc3545;">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `).join('');
    }

    getStatusColor(status) {
        const colors = {
            active: '#28a745',
            paused: '#ffc107',
            closed: '#dc3545',
            completed: '#6c757d'
        };
        return colors[status] || '#6c757d';
    }

    async viewApplications(jobId) {
        try {
            const response = await fetch(`/api/jobs/${jobId}/applications`);
            const data = await response.json();

            if (data.success) {
                this.displayApplicationsModal(data.applications, jobId);
            }
        } catch (err) {
            console.error('Error loading applications:', err);
            alert('Failed to load applications');
        }
    }

    displayApplicationsModal(applications, jobId) {
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
        
        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 800px; max-height: 80vh; overflow-y: auto; width: 90%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2>Applications (${applications.length})</h2>
                    <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                ${applications.length === 0 ? '<p style="text-align: center; color: #666;">No applications yet</p>' : applications.map(app => `
                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                            <div>
                                <h4>${app.freelancer_name}</h4>
                                <p style="color: #666; font-size: 0.9rem;">${app.freelancer_email}</p>
                            </div>
                            <span class="badge" style="background: ${this.getApplicationStatusColor(app.status)}; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; height: fit-content;">${app.status}</span>
                        </div>
                        ${app.cover_letter ? `<p style="margin-bottom: 1rem;"><strong>Cover Letter:</strong><br>${app.cover_letter}</p>` : ''}
                        ${app.proposed_rate ? `<p><strong>Proposed Rate:</strong> ${app.proposed_rate} VCreds</p>` : ''}
                        ${app.proposed_timeline ? `<p><strong>Estimated Duration:</strong> ${app.proposed_timeline}</p>` : ''}
                        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                            <button onclick="companyJobManager.updateApplicationStatus(${app.id}, 'shortlisted')" class="apply-btn" style="background: #ffc107; font-size: 0.85rem;">Shortlist</button>
                            <button onclick="companyJobManager.updateApplicationStatus(${app.id}, 'accepted')" class="apply-btn" style="background: #28a745; font-size: 0.85rem;">Accept</button>
                            <button onclick="companyJobManager.updateApplicationStatus(${app.id}, 'rejected')" class="apply-btn" style="background: #dc3545; font-size: 0.85rem;">Reject</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    getApplicationStatusColor(status) {
        const colors = {
            pending: '#6c757d',
            reviewed: '#17a2b8',
            shortlisted: '#ffc107',
            accepted: '#28a745',
            rejected: '#dc3545'
        };
        return colors[status] || '#6c757d';
    }

    async updateApplicationStatus(applicationId, status) {
        try {
            const response = await fetch(`/api/jobs/applications/${applicationId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            const data = await response.json();

            if (data.success) {
                alert(`Application ${status} successfully!`);
                document.querySelector('.modal')?.remove();
                // Reload applications to show updated status
                this.loadAllApplications();
            } else {
                alert('Failed to update application status');
            }
        } catch (err) {
            console.error('Error updating application:', err);
            alert('Failed to update application status');
        }
    }

    async pauseJob(jobId) {
        await this.updateJobStatus(jobId, 'paused');
    }

    async activateJob(jobId) {
        await this.updateJobStatus(jobId, 'active');
    }

    async closeJob(jobId) {
        if (!confirm('Are you sure you want to close this job?')) return;
        await this.updateJobStatus(jobId, 'closed');
    }

    async updateJobStatus(jobId, status) {
        try {
            const response = await fetch(`/api/jobs/${jobId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            const data = await response.json();

            if (data.success) {
                alert(`Job ${status} successfully!`);
                this.loadCompanyJobs();
            } else {
                alert('Failed to update job status');
            }
        } catch (err) {
            console.error('Error updating job:', err);
            alert('Failed to update job status');
        }
    }
}

// Initialize when DOM is ready
let companyJobManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        companyJobManager = new CompanyJobManager();
        window.companyJobManager = companyJobManager;
    });
} else {
    companyJobManager = new CompanyJobManager();
    window.companyJobManager = companyJobManager;
}

// Clear job form
function clearJobForm() {
    document.getElementById('job-post-form').reset();
}
