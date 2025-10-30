// Company Dashboard Main Manager
class CompanyDashboardManager {
    constructor() {
        this.companyData = null;
        this.stats = {
            activeJobs: 0,
            totalApplications: 0,
            hiredCount: 0,
            vcredsBalance: 0
        };
        this.init();
    }

    init() {
        this.clearDummyData(); // Clear any existing dummy data
        this.loadCompanyData();
        this.updateStats();
        this.loadRecentActivity();
        this.setupEventListeners();
    }

    // Clear all dummy data from localStorage
    clearDummyData() {
        // Clear company-specific dummy data
        const dummyKeys = [
            'company_jobs',
            'company_applications', 
            'company_transactions',
            'company_active_jobs',
            'company_total_applications',
            'company_hired_count'
        ];
        
        dummyKeys.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    // If it's an array with sample data, clear it
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    // If it's not valid JSON, remove it
                    localStorage.removeItem(key);
                }
            }
        });
    }

    // Load company data from localStorage or API
    loadCompanyData() {
        const userData = authManager.getCurrentUser();
        console.log('Company dashboard - checking user data:', userData);
        
        if (userData && userData.user_type === 'company') {
            console.log('Company user verified, loading dashboard');
            this.companyData = userData;
            this.updateCompanyInfo();
        } else {
            console.log('Not a company user or no user data, redirecting to login');
            console.log('User type:', userData ? userData.user_type : 'No user data');
            // Redirect to login if not a company user
            window.location.href = '/login';
        }
    }

    // Update company information display
    updateCompanyInfo() {
        if (this.companyData) {
            const profileName = document.getElementById('profile-name');
            const welcomeMessage = document.getElementById('welcome-message');
            
            if (profileName) {
                profileName.textContent = this.companyData.username || 'Company';
            }
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome back, ${this.companyData.username || 'Company'}!`;
            }
        }
    }

    // Update dashboard statistics
    async updateStats() {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        
        // Load stats from localStorage
        this.stats.activeJobs = parseInt(localStorage.getItem('company_active_jobs') || '0');
        this.stats.totalApplications = parseInt(localStorage.getItem('company_total_applications') || '0');
        this.stats.hiredCount = parseInt(localStorage.getItem('company_hired_count') || '0');
        
        // Fetch real balance from API
        if (userInfo) {
            try {
                const response = await fetch(`/api/credits/balance/${userInfo.id}`);
                const data = await response.json();
                if (data.success) {
                    this.stats.vcredsBalance = data.balance || 0;
                }
            } catch (err) {
                console.error('Error loading balance:', err);
                this.stats.vcredsBalance = parseInt(localStorage.getItem('company_vcreds_balance') || '0');
            }
        } else {
            this.stats.vcredsBalance = parseInt(localStorage.getItem('company_vcreds_balance') || '0');
        }

        // Update display
        this.displayStats();
    }

    displayStats() {
        const elements = {
            'active-jobs': this.stats.activeJobs,
            'total-applications': this.stats.totalApplications,
            'hired-count': this.stats.hiredCount,
            'vcreds-balance': this.stats.vcredsBalance,
            'company-credits-balance': this.stats.vcredsBalance,
            'active-projects-count': this.stats.activeJobs
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value.toLocaleString();
            }
        });
    }

    // Load recent activity
    loadRecentActivity() {
        const activityList = document.getElementById('recent-activity-list');
        if (!activityList) return;

        // Show empty state for new companies
        activityList.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-clock" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3>No Recent Activity</h3>
                <p>Your recent activities will appear here</p>
                <button onclick="showSection('post-jobs')" class="apply-btn" style="margin-top: 1rem;">
                    <i class="fas fa-plus"></i> Post Your First Job
                </button>
            </div>
        `;
    }

    // Setup event listeners
    setupEventListeners() {
        // Job status filter
        const jobStatusFilter = document.getElementById('job-status-filter');
        if (jobStatusFilter) {
            jobStatusFilter.addEventListener('change', (e) => {
                this.filterJobs(e.target.value);
            });
        }

        // Application filter
        const applicationFilter = document.getElementById('application-filter');
        if (applicationFilter) {
            applicationFilter.addEventListener('change', (e) => {
                this.filterApplications(e.target.value);
            });
        }

        // Custom credits input
        const customCreditsInput = document.getElementById('custom-credits');
        if (customCreditsInput) {
            customCreditsInput.addEventListener('input', (e) => {
                this.updateCustomCost(e.target.value);
            });
        }
    }

    // Filter jobs by status
    filterJobs(status) {
        console.log('Filtering jobs by status:', status);
        // Implementation will be added when job management is implemented
    }

    // Filter applications
    filterApplications(status) {
        console.log('Filtering applications by status:', status);
        // Implementation will be added when application management is implemented
    }

    // Update custom credit cost calculation
    updateCustomCost(credits) {
        const costElement = document.getElementById('custom-cost');
        const purchaseBtn = document.getElementById('purchase-btn');
        
        if (costElement && purchaseBtn) {
            const amount = parseInt(credits) || 0;
            const cost = amount * 10; // 1 VCred = ₹10
            
            costElement.textContent = `₹${cost.toLocaleString()}`;
            purchaseBtn.disabled = amount < 10;
        }
    }

    // Increment stats (for demo purposes)
    incrementStat(statName) {
        if (this.stats.hasOwnProperty(statName)) {
            this.stats[statName]++;
            localStorage.setItem(`company_${statName.toLowerCase()}`, this.stats[statName].toString());
            this.displayStats();
        }
    }
}

// Package selection for credit purchase
function selectPackage(credits, cost) {
    const customCreditsInput = document.getElementById('custom-credits');
    if (customCreditsInput) {
        customCreditsInput.value = credits;
        companyDashboard.updateCustomCost(credits);
    }
    
    // Highlight selected package
    document.querySelectorAll('.credit-package').forEach(pkg => {
        pkg.style.borderColor = '#e0e0e0';
        pkg.style.background = 'white';
    });
    
    event.target.closest('.credit-package').style.borderColor = '#667eea';
    event.target.closest('.credit-package').style.background = '#f8f9ff';
}

// Clear job posting form
function clearJobForm() {
    const form = document.getElementById('job-post-form');
    if (form) {
        form.reset();
    }
}

// Initialize company dashboard
let companyDashboard;
document.addEventListener('DOMContentLoaded', () => {
    companyDashboard = new CompanyDashboardManager();
});

// Make it globally available
window.companyDashboard = companyDashboard;