// Company Jobs Management
class CompanyJobsManager {
    constructor() {
        this.jobs = [];
        this.applications = [];
        this.init();
    }

    init() {
        this.loadJobs();
        this.loadApplications();
        this.setupEventListeners();
        this.displayJobs();
        this.displayApplications();
    }

    // Load jobs from localStorage
    loadJobs() {
        const storedJobs = localStorage.getItem('company_jobs');
        if (storedJobs) {
            this.jobs = JSON.parse(storedJobs);
        } else {
            this.generateSampleJobs();
        }
    }

    // Load applications from localStorage
    loadApplications() {
        const storedApplications = localStorage.getItem('company_applications');
        if (storedApplications) {
            this.applications = JSON.parse(storedApplications);
        } else {
            this.generateSampleApplications();
        }
    }

    // Initialize empty jobs for new companies
    generateSampleJobs() {
        // Clear any existing dummy data
        localStorage.removeItem('company_jobs');
        this.jobs = [];
        this.saveJobs();
    }

    // Initialize empty applications for new companies
    generateSampleApplications() {
        // Clear any existing dummy data
        localStorage.removeItem('company_applications');
        this.applications = [];
        this.saveApplications();
    }

    // Setup event listeners
    setupEventListeners() {
        // Job posting form
        const jobPostForm = document.getElementById('job-post-form');
        if (jobPostForm) {
            jobPostForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleJobPost();
            });
        }
    }

    // Handle job posting
    handleJobPost() {
        const formData = {
            title: document.getElementById('job-title').value,
            description: document.getElementById('job-description').value,
            category: document.getElementById('job-category').value,
            duration: document.getElementById('job-duration').value,
            budgetType: document.getElementById('budget-type').value,
            budget: parseInt(document.getElementById('budget-amount').value),
            skills: document.getElementById('required-skills').value.split(',').map(s => s.trim()),
            experienceLevel: document.getElementById('experience-level').value
        };

        // Validate form
        if (!formData.title || !formData.description || !formData.category || !formData.budget) {
            alert('Please fill in all required fields');
            return;
        }

        // Check if company has enough VCreds
        const companyBalance = parseInt(localStorage.getItem('company_vcreds_balance') || '0');
        if (companyBalance < formData.budget) {
            alert('Insufficient VCreds balance. Please purchase more VCreds first.');
            return;
        }

        // Create new job
        const newJob = {
            id: `JOB${Date.now()}`,
            ...formData,
            status: 'active',
            applicationsCount: 0,
            postedDate: new Date().toISOString()
        };

        this.jobs.unshift(newJob);
        this.saveJobs();
        this.displayJobs();

        // Update stats
        this.updateStats();

        // Clear form
        document.getElementById('job-post-form').reset();

        // Show success message
        alert('Job posted successfully!');

        // Switch to job listings view
        showSection('job-listings');
    }

    // Display jobs
    displayJobs() {
        const jobsList = document.getElementById('company-jobs-list');
        if (!jobsList) return;

        if (this.jobs.length === 0) {
            jobsList.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-briefcase" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No Jobs Posted Yet</h3>
                    <p>Start by posting your first job</p>
                    <button onclick="showSection('post-jobs')" class="apply-btn" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Post Your First Job
                    </button>
                </div>
            `;
            return;
        }

        const jobsHTML = this.jobs.map(job => {
            const statusColor = {
                'active': '#28a745',
                'paused': '#ffc107',
                'completed': '#6c757d'
            }[job.status] || '#6c757d';

            return `
                <div class="job-card" style="background: white; border-radius: 10px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div class="job-header" style="display: flex; justify-content: between; align-items: start; margin-bottom: 1rem;">
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 0.5rem 0; color: #333;">${job.title}</h3>
                            <div class="job-meta" style="display: flex; gap: 1rem; color: #666; font-size: 0.9rem;">
                                <span><i class="fas fa-calendar"></i> ${new Date(job.postedDate).toLocaleDateString()}</span>
                                <span><i class="fas fa-coins"></i> ${job.budget} VCreds</span>
                                <span><i class="fas fa-file-alt"></i> ${job.applicationsCount} applications</span>
                            </div>
                        </div>
                        <div class="job-status" style="background: ${statusColor}; color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; text-transform: capitalize;">
                            ${job.status}
                        </div>
                    </div>
                    
                    <p style="color: #666; margin-bottom: 1rem; line-height: 1.5;">${job.description.substring(0, 150)}${job.description.length > 150 ? '...' : ''}</p>
                    
                    <div class="job-skills" style="margin-bottom: 1rem;">
                        ${job.skills.map(skill => `
                            <span style="background: #f8f9fa; color: #495057; padding: 0.25rem 0.5rem; border-radius: 15px; font-size: 0.8rem; margin-right: 0.5rem; display: inline-block; margin-bottom: 0.25rem;">${skill}</span>
                        `).join('')}
                    </div>
                    
                    <div class="job-actions" style="display: flex; gap: 0.5rem;">
                        <button onclick="viewJobApplications('${job.id}')" class="apply-btn" style="background: #667eea; font-size: 0.9rem; padding: 0.5rem 1rem;">
                            <i class="fas fa-eye"></i> View Applications (${job.applicationsCount})
                        </button>
                        <button onclick="editJob('${job.id}')" class="apply-btn" style="background: #28a745; font-size: 0.9rem; padding: 0.5rem 1rem;">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="toggleJobStatus('${job.id}')" class="apply-btn" style="background: #ffc107; color: #333; font-size: 0.9rem; padding: 0.5rem 1rem;">
                            <i class="fas fa-pause"></i> ${job.status === 'active' ? 'Pause' : 'Activate'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        jobsList.innerHTML = jobsHTML;
    }

    // Display applications
    displayApplications() {
        const applicationsList = document.getElementById('applications-list');
        if (!applicationsList) return;

        if (this.applications.length === 0) {
            applicationsList.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-file-alt" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No Applications Yet</h3>
                    <p>Applications will appear here when freelancers apply to your jobs</p>
                </div>
            `;
            return;
        }

        const applicationsHTML = this.applications.map(app => {
            const statusColor = {
                'new': '#007bff',
                'reviewed': '#28a745',
                'shortlisted': '#ffc107',
                'rejected': '#dc3545'
            }[app.status] || '#6c757d';

            return `
                <div class="application-card" style="background: white; border-radius: 10px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div class="application-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h4 style="margin: 0 0 0.25rem 0; color: #333;">${app.freelancerName}</h4>
                            <p style="margin: 0; color: #666; font-size: 0.9rem;">Applied for: ${app.jobTitle}</p>
                            <p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.8rem;">
                                <i class="fas fa-calendar"></i> ${new Date(app.appliedDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div class="application-status" style="background: ${statusColor}; color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; text-transform: capitalize;">
                            ${app.status}
                        </div>
                    </div>
                    
                    <div class="application-details" style="margin-bottom: 1rem;">
                        <div style="display: flex; gap: 2rem; margin-bottom: 0.5rem;">
                            <span style="color: #666;"><strong>Bid:</strong> ${app.bidAmount} VCreds</span>
                            <span style="color: #666;"><strong>Delivery:</strong> ${app.deliveryTime}</span>
                        </div>
                        <p style="color: #666; line-height: 1.5; margin: 0;">${app.proposal.substring(0, 200)}${app.proposal.length > 200 ? '...' : ''}</p>
                    </div>
                    
                    <div class="application-actions" style="display: flex; gap: 0.5rem;">
                        <button onclick="viewFullApplication('${app.id}')" class="apply-btn" style="background: #667eea; font-size: 0.9rem; padding: 0.5rem 1rem;">
                            <i class="fas fa-eye"></i> View Full
                        </button>
                        <button onclick="shortlistApplication('${app.id}')" class="apply-btn" style="background: #28a745; font-size: 0.9rem; padding: 0.5rem 1rem;">
                            <i class="fas fa-star"></i> Shortlist
                        </button>
                        <button onclick="rejectApplication('${app.id}')" class="apply-btn" style="background: #dc3545; font-size: 0.9rem; padding: 0.5rem 1rem;">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        applicationsList.innerHTML = applicationsHTML;
    }

    // Save jobs to localStorage
    saveJobs() {
        localStorage.setItem('company_jobs', JSON.stringify(this.jobs));
    }

    // Save applications to localStorage
    saveApplications() {
        localStorage.setItem('company_applications', JSON.stringify(this.applications));
    }

    // Update stats
    updateStats() {
        const activeJobs = this.jobs.filter(job => job.status === 'active').length;
        const totalApplications = this.applications.length;
        
        localStorage.setItem('company_active_jobs', activeJobs.toString());
        localStorage.setItem('company_total_applications', totalApplications.toString());
        
        // Update display if dashboard manager exists
        if (window.companyDashboard) {
            window.companyDashboard.updateStats();
        }
    }
}

// Global functions for job management
function viewJobApplications(jobId) {
    console.log('Viewing applications for job:', jobId);
    showSection('applications');
}

function editJob(jobId) {
    console.log('Editing job:', jobId);
    alert('Job editing feature coming soon!');
}

function toggleJobStatus(jobId) {
    console.log('Toggling status for job:', jobId);
    alert('Job status toggle feature coming soon!');
}

function viewFullApplication(appId) {
    console.log('Viewing full application:', appId);
    alert('Full application view coming soon!');
}

function shortlistApplication(appId) {
    console.log('Shortlisting application:', appId);
    alert('Application shortlisted!');
}

function rejectApplication(appId) {
    console.log('Rejecting application:', appId);
    const confirmed = confirm('Are you sure you want to reject this application?');
    if (confirmed) {
        alert('Application rejected!');
    }
}

// Initialize company jobs manager
let companyJobsManager;
document.addEventListener('DOMContentLoaded', () => {
    companyJobsManager = new CompanyJobsManager();
});

// Make it globally available
window.companyJobsManager = companyJobsManager;