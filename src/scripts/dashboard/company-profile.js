// Company Profile Manager
class CompanyProfileManager {
    constructor() {
        this.profileData = null;
        this.init();
    }

    init() {
        this.loadCompanyProfile();
        this.setupFormHandlers();
    }

    // Load company profile data from API
    async loadCompanyProfile() {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        
        if (!userInfo || userInfo.user_type !== 'company') {
            console.log('Not a company user');
            return;
        }

        try {
            const response = await fetch(`/api/company/profile/${userInfo.id}`);
            const data = await response.json();
            
            if (data.success && data.profile) {
                this.profileData = data.profile;
                this.populateProfileForm();
            } else {
                console.log('No company profile found');
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading company profile:', error);
            this.showEmptyState();
        }
    }

    // Populate the profile form with data
    populateProfileForm() {
        if (!this.profileData) return;

        const fields = {
            'company-name-profile': this.profileData.company_name,
            'company-registration-profile': this.profileData.registration_number,
            'business-email-profile': this.profileData.business_email,
            'business-phone-profile': this.profileData.business_phone,
            'business-address-profile': this.profileData.business_address,
            'company-description': this.profileData.company_description || ''
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.value = value;
            }
        });

        console.log('✅ Company profile loaded successfully');
    }

    // Show empty state if no profile data
    showEmptyState() {
        console.log('Showing empty profile state');
    }

    // Setup form submission handler
    setupFormHandlers() {
        const form = document.getElementById('company-profile-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        // Cancel button
        const cancelBtn = form?.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.loadCompanyProfile(); // Reload original data
            });
        }
    }

    // Handle profile update
    async handleProfileUpdate(e) {
        e.preventDefault();

        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo) return;

        const formData = {
            companyName: document.getElementById('company-name-profile').value,
            registrationNumber: document.getElementById('company-registration-profile').value,
            businessEmail: document.getElementById('business-email-profile').value,
            businessPhone: document.getElementById('business-phone-profile').value,
            businessAddress: document.getElementById('business-address-profile').value,
            companyDescription: document.getElementById('company-description').value
        };

        try {
            const response = await fetch(`/api/company/profile/${userInfo.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                this.profileData = result.profile;
                alert('✅ Profile updated successfully!');
                
                // Update the company name in the sidebar
                const profileName = document.getElementById('profile-name');
                if (profileName) {
                    profileName.textContent = formData.companyName;
                }
            } else {
                alert('❌ Failed to update profile: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('❌ Failed to update profile. Please try again.');
        }
    }
}

// Initialize when DOM is ready
let companyProfileManager;
document.addEventListener('DOMContentLoaded', () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.user_type === 'company') {
        companyProfileManager = new CompanyProfileManager();
    }
});

// Make it globally available
window.companyProfileManager = companyProfileManager;
