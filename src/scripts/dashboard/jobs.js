// Freelancer Job Browsing and Application

class JobBrowser {
    constructor() {
        this.init();
    }

    init() {
        this.loadJobs();
        this.setupFilters();
        this.loadMyApplications();
    }

    setupFilters() {
        const categoryFilter = document.querySelector('#jobs .filter-select');
        const searchInput = document.querySelector('#jobs .search-input');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.loadJobs());
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => this.loadJobs(), 500);
            });
        }
    }

    async loadJobs() {
        const container = document.getElementById('jobs-container');
        if (!container) return;

        const category = document.querySelector('#jobs .filter-select')?.value || '';
        const search = document.querySelector('#jobs .search-input')?.value || '';

        try {
            const params = new URLSearchParams();
            if (category && category !== 'All Categories') params.append('category', category);
            if (search) params.append('search', search);

            const response = await fetch(`/api/jobs/browse?${params}`);
            const data = await response.json();

            if (data.success) {
                this.displayJobs(data.jobs, container);
                this.loadRecentJobs(data.jobs.slice(0, 3));
            }
        } catch (err) {
            console.error('Error loading jobs:', err);
            container.innerHTML = '<p style="text-align: center; color: #666;">Failed to load jobs</p>';
        }
    }

    loadRecentJobs(jobs) {
        const recentContainer = document.getElementById('recent-jobs-container');
        if (!recentContainer) return;

        if (jobs.length === 0) {
            recentContainer.innerHTML = '<p style="text-align: center; color: #666;">No recent jobs available</p>';
            return;
        }

        this.displayJobs(jobs, recentContainer);
    }

    displayJobs(jobs, container) {
        if (jobs.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No jobs found</p>';
            return;
        }

        container.innerHTML = jobs.map(job => `
            <div class="job-card" style="background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin-bottom: 0.5rem; color: #333;">${job.title}</h3>
                        <p style="color: #667eea; font-size: 0.9rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-building"></i> ${job.company_name}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.25rem; font-weight: bold; color: #28a745;">${job.budget_amount} VCreds</div>
                        <div style="font-size: 0.85rem; color: #666;">${job.budget_type}</div>
                    </div>
                </div>
                
                <p style="color: #666; margin-bottom: 1rem; line-height: 1.6;">${job.description.substring(0, 200)}${job.description.length > 200 ? '...' : ''}</p>
                
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; font-size: 0.9rem; color: #666;">
                    <span><i class="fas fa-tag"></i> ${this.formatCategory(job.category)}</span>
                    <span><i class="fas fa-clock"></i> ${this.formatDuration(job.duration)}</span>
                    <span><i class="fas fa-chart-line"></i> ${this.formatExperience(job.experience_level)}</span>
                </div>
                
                ${job.required_skills ? `
                    <div style="margin-bottom: 1rem;">
                        <strong style="font-size: 0.9rem;">Required Skills:</strong>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
                            ${job.required_skills.split(',').map(skill => 
                                `<span style="background: #e3f2fd; color: #1976d2; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.85rem;">${skill.trim()}</span>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <button onclick="jobBrowser.applyToJob(${job.id}, '${job.title}')" class="apply-btn" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                        <i class="fas fa-paper-plane"></i> Apply Now
                    </button>
                    <button onclick="jobBrowser.viewJobDetails(${job.id})" class="apply-btn" style="background: #6c757d;">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatCategory(category) {
        return category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    formatDuration(duration) {
        const map = {
            '1-week': 'Less than 1 week',
            '1-month': '1-4 weeks',
            '3-months': '1-3 months',
            '6-months': '3-6 months',
            'long-term': '6+ months'
        };
        return map[duration] || duration;
    }

    formatExperience(level) {
        const map = {
            'entry': 'Entry Level',
            'intermediate': 'Intermediate',
            'expert': 'Expert'
        };
        return map[level] || level;
    }

    applyToJob(jobId, jobTitle) {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo) {
            alert('Please login to apply for jobs');
            return;
        }

        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
        
        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h2 style="margin-bottom: 1rem;">Apply to: ${jobTitle}</h2>
                <form id="application-form">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Cover Letter</label>
                        <textarea id="cover-letter" class="form-textarea" rows="6" placeholder="Explain why you're a great fit for this job..." required></textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Proposed Rate (VCreds)</label>
                            <input type="number" id="proposed-rate" class="form-input" min="1" placeholder="Your rate">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Estimated Duration</label>
                            <input type="text" id="estimated-duration" class="form-input" placeholder="e.g., 2 weeks">
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button type="button" onclick="this.closest('.modal').remove()" class="apply-btn" style="background: #6c757d;">Cancel</button>
                        <button type="submit" class="apply-btn" style="background: #28a745;">Submit Application</button>
                    </div>
                </form>
            </div>
        `;
        
        modal.className = 'modal';
        document.body.appendChild(modal);

        const form = modal.querySelector('#application-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitApplication(jobId, modal);
        });
    }

    async submitApplication(jobId, modal) {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        
        // Get values from modal's form elements
        const coverLetter = modal.querySelector('#cover-letter').value;
        const proposedRate = modal.querySelector('#proposed-rate').value;
        const estimatedDuration = modal.querySelector('#estimated-duration').value;
        
        const applicationData = {
            jobId,
            freelancerId: userInfo.id,
            coverLetter: coverLetter,
            proposedRate: proposedRate || null,
            estimatedDuration: estimatedDuration || null
        };

        console.log('Submitting application:', applicationData);

        try {
            const response = await fetch('/api/jobs/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(applicationData)
            });

            const data = await response.json();
            console.log('Application response:', data);

            if (data.success) {
                alert('Application submitted successfully! You can view it in "My Applications" section.');
                modal.remove();
                this.loadMyApplications();
            } else {
                alert(data.message || 'Failed to submit application');
            }
        } catch (err) {
            console.error('Error submitting application:', err);
            alert('Failed to submit application. Please try again.');
        }
    }

    async viewJobDetails(jobId) {
        // For now, just show an alert. You can expand this to show a detailed modal
        alert('Job details view - Coming soon!');
    }

    async loadMyApplications() {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo) return;

        const container = document.getElementById('applications-container');
        if (!container) return;

        try {
            const response = await fetch(`/api/jobs/applications/freelancer/${userInfo.id}`);
            const data = await response.json();

            if (data.success) {
                this.displayApplications(data.applications, container);
            }
        } catch (err) {
            console.error('Error loading applications:', err);
            container.innerHTML = '<p style="text-align: center; color: #666;">Failed to load applications</p>';
        }
    }

    displayApplications(applications, container) {
        if (applications.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">You haven\'t applied to any jobs yet</p>';
            return;
        }

        container.innerHTML = applications.map(app => `
            <div class="job-card" style="background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin-bottom: 0.5rem;">${app.job_title}</h3>
                        <p style="color: #667eea; font-size: 0.9rem;">
                            <i class="fas fa-building"></i> ${app.company_name}
                        </p>
                    </div>
                    <span class="badge" style="background: ${this.getStatusColor(app.status)}; color: white; padding: 0.5rem 1rem; border-radius: 20px;">${app.status}</span>
                </div>
                
                <p style="color: #666; margin-bottom: 1rem;">${app.job_description.substring(0, 150)}...</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1rem; font-size: 0.9rem;">
                    <div>
                        <strong>Budget:</strong> ${app.budget_amount} VCreds
                    </div>
                    ${app.proposed_rate ? `<div><strong>Your Rate:</strong> ${app.proposed_rate} VCreds</div>` : ''}
                    <div>
                        <strong>Applied:</strong> ${new Date(app.applied_at).toLocaleDateString()}
                    </div>
                </div>
            </div>
        `).join('');
    }

    getStatusColor(status) {
        const colors = {
            pending: '#6c757d',
            reviewed: '#17a2b8',
            shortlisted: '#ffc107',
            accepted: '#28a745',
            rejected: '#dc3545'
        };
        return colors[status] || '#6c757d';
    }
}

// Initialize when DOM is ready
let jobBrowser;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        jobBrowser = new JobBrowser();
        window.jobBrowser = jobBrowser;
    });
} else {
    jobBrowser = new JobBrowser();
    window.jobBrowser = jobBrowser;
}
