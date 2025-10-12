// Jobs Management
class JobsManager {
    constructor() {
        this.jobs = [];
        this.filteredJobs = [];
        this.currentFilter = 'All Categories';
        this.currentSearch = '';
        this.init();
    }

    init() {
        this.loadJobs();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('#jobs .search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentSearch = e.target.value.toLowerCase();
                this.filterJobs();
            });
        }

        // Filter functionality
        const filterSelect = document.querySelector('#jobs .filter-select');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.filterJobs();
            });
        }
    }

    // Load available jobs
    loadJobs() {
        // Initialize empty jobs array for new users
        this.jobs = [];

        this.filteredJobs = [...this.jobs];
        this.renderJobs();
    }

    // Filter jobs based on search and category
    filterJobs() {
        this.filteredJobs = this.jobs.filter(job => {
            const matchesSearch = this.currentSearch === '' || 
                job.title.toLowerCase().includes(this.currentSearch) ||
                job.company.toLowerCase().includes(this.currentSearch) ||
                job.description.toLowerCase().includes(this.currentSearch) ||
                job.skills.some(skill => skill.toLowerCase().includes(this.currentSearch));

            const matchesCategory = this.currentFilter === 'All Categories' || 
                job.category === this.currentFilter;

            return matchesSearch && matchesCategory;
        });

        this.renderJobs();
    }

    // Render jobs to the container
    renderJobs() {
        const container = document.getElementById('jobs-container');
        if (!container) return;

        if (this.filteredJobs.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-briefcase" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <h3>No Jobs Found</h3>
                    <p>Try adjusting your search criteria or check back later for new opportunities!</p>
                    ${this.currentSearch || this.currentFilter !== 'All Categories' ? 
                        '<button class="apply-btn" onclick="window.jobsManager.clearFilters()" style="margin-top: 1rem;">Clear Filters</button>' : 
                        ''
                    }
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredJobs.map(job => `
            <div class="job-card">
                <div class="job-header">
                    <div>
                        <div class="job-title">${job.title}</div>
                        <div class="job-company">${job.company}</div>
                    </div>
                    <div class="job-budget">${job.budget}</div>
                </div>
                <div class="job-description">${job.description}</div>
                <div class="job-skills">
                    ${job.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
                <div class="job-meta">
                    <span class="job-date">Posted ${job.postedDate}</span>
                    <button class="apply-btn" onclick="window.jobsManager.applyToJob(${job.id})">Apply Now</button>
                </div>
            </div>
        `).join('');
    }

    // Apply to a specific job
    applyToJob(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) {
            alert('Job not found.');
            return;
        }

        const userInfo = authManager.getCurrentUser();
        if (!userInfo || !userInfo.id) {
            alert('Please log in to apply for jobs.');
            return;
        }

        // Check if already applied
        const applications = JSON.parse(localStorage.getItem('userApplications') || '[]');
        const alreadyApplied = applications.some(app => app.jobId === jobId);
        
        if (alreadyApplied) {
            alert('You have already applied to this job.');
            return;
        }

        // Create new application
        const newApplication = {
            id: Date.now(),
            jobId: jobId,
            jobTitle: job.title,
            company: job.company,
            status: "Under Review",
            description: "Your application has been submitted successfully and is under review.",
            appliedDate: new Date().toLocaleDateString(),
            budget: job.budget
        };
        
        applications.push(newApplication);
        localStorage.setItem('userApplications', JSON.stringify(applications));
        
        alert(`Application submitted successfully for "${job.title}"!`);
        
        // Create notification for application submission
        if (window.notificationsManager) {
            window.notificationsManager.notifyApplicationStatus(job.title, 'submitted and under review');
        }
        
        // Update dashboard stats
        if (window.dashboardOverviewManager) {
            window.dashboardOverviewManager.updateStats();
        }
    }

    // Clear all filters
    clearFilters() {
        this.currentSearch = '';
        this.currentFilter = 'All Categories';
        
        // Reset UI elements
        const searchInput = document.querySelector('#jobs .search-input');
        const filterSelect = document.querySelector('#jobs .filter-select');
        
        if (searchInput) searchInput.value = '';
        if (filterSelect) filterSelect.value = 'All Categories';
        
        this.filterJobs();
    }

    // Refresh jobs (for external calls)
    refreshJobs() {
        this.loadJobs();
    }

    // Get jobs by category
    getJobsByCategory(category) {
        return this.jobs.filter(job => job.category === category);
    }

    // Get job by ID
    getJobById(jobId) {
        return this.jobs.find(job => job.id === jobId);
    }
}

// Create global jobs manager instance
window.jobsManager = new JobsManager();