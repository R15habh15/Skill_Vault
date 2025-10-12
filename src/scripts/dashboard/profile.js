// Profile Management
class ProfileManager {
    constructor() {
        this.profileData = {};
        this.init();
    }

    init() {
        this.loadProfileData();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Profile form submission
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile();
            });
        }
    }

    // Load profile data
    loadProfileData() {
        const userInfo = authManager.getCurrentUser();
        this.profileData = authManager.getUserProfile();
        
        if (!userInfo) return;

        // Populate profile form
        const fullNameInput = document.getElementById('profile-fullname');
        const emailInput = document.getElementById('profile-email');
        const titleInput = document.getElementById('profile-title-input');
        const bioInput = document.getElementById('profile-bio');

        if (fullNameInput) {
            fullNameInput.value = this.profileData.fullName || userInfo.username || '';
        }
        
        if (emailInput) {
            emailInput.value = userInfo.email || '';
        }
        
        if (titleInput) {
            titleInput.value = this.profileData.title || 'Freelancer';
        }
        
        if (bioInput) {
            bioInput.value = this.profileData.bio || '';
        }
    }

    // Update profile
    updateProfile() {
        const fullNameInput = document.getElementById('profile-fullname');
        const titleInput = document.getElementById('profile-title-input');
        const bioInput = document.getElementById('profile-bio');

        if (!fullNameInput || !titleInput || !bioInput) {
            alert('Profile form elements not found.');
            return;
        }

        // Validate inputs
        const fullName = fullNameInput.value.trim();
        const title = titleInput.value.trim();
        const bio = bioInput.value.trim();

        if (!fullName) {
            alert('Please enter your full name.');
            fullNameInput.focus();
            return;
        }

        if (!title) {
            alert('Please enter your professional title.');
            titleInput.focus();
            return;
        }

        // Update profile data
        const updatedProfile = {
            ...this.profileData,
            fullName: fullName,
            title: title,
            bio: bio,
            lastUpdated: new Date().toISOString()
        };

        // Save to localStorage
        const success = authManager.updateUserProfile(updatedProfile);
        
        if (success) {
            this.profileData = updatedProfile;
            
            // Update sidebar profile name if full name changed
            const profileNameEl = document.getElementById('profile-name');
            if (profileNameEl && fullName) {
                profileNameEl.textContent = fullName;
            }

            // Show success message
            this.showSuccessMessage('Profile updated successfully!');
            
            // Update profile stats
            this.updateProfileStats();
        } else {
            alert('Failed to update profile. Please try again.');
        }
    }

    // Show success message
    showSuccessMessage(message) {
        // Create success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(40, 167, 69, 0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            font-weight: 500;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);

        // Add CSS animations if not already present
        if (!document.getElementById('profile-animations')) {
            const style = document.createElement('style');
            style.id = 'profile-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Update profile statistics
    updateProfileStats() {
        // Calculate profile completion percentage
        const completionScore = this.calculateProfileCompletion();
        
        // Update sidebar stats if needed
        const profileStats = document.querySelector('.profile-stats');
        if (profileStats) {
            // You could add a profile completion indicator here
        }
    }

    // Calculate profile completion percentage
    calculateProfileCompletion() {
        const userInfo = authManager.getCurrentUser();
        let score = 0;
        const maxScore = 100;

        // Basic info (40 points)
        if (userInfo?.username) score += 10;
        if (userInfo?.email) score += 10;
        if (this.profileData.fullName) score += 10;
        if (this.profileData.title && this.profileData.title !== 'Freelancer') score += 10;

        // Bio (20 points)
        if (this.profileData.bio && this.profileData.bio.length > 50) score += 20;

        // Portfolio (20 points)
        const pastProjects = JSON.parse(localStorage.getItem('userPastProjects') || '[]');
        if (pastProjects.length > 0) score += 10;
        if (pastProjects.length >= 3) score += 10;

        // Activity (20 points)
        const applications = JSON.parse(localStorage.getItem('userApplications') || '[]');
        const proposals = JSON.parse(localStorage.getItem('userProposals') || '[]');
        
        if (applications.length > 0) score += 10;
        if (proposals.length > 0) score += 10;

        return Math.min(score, maxScore);
    }

    // Get profile completion status
    getProfileCompletionStatus() {
        const completion = this.calculateProfileCompletion();
        let status = 'Getting Started';
        let color = '#ff6b6b';

        if (completion >= 80) {
            status = 'Excellent';
            color = '#28a745';
        } else if (completion >= 60) {
            status = 'Good';
            color = '#ffc107';
        } else if (completion >= 40) {
            status = 'Fair';
            color = '#fd7e14';
        }

        return { completion, status, color };
    }

    // Add profile completion widget
    addProfileCompletionWidget() {
        const profileSection = document.getElementById('profile');
        if (!profileSection) return;

        const { completion, status, color } = this.getProfileCompletionStatus();
        
        const widgetHTML = `
            <div style="background: rgba(255, 255, 255, 0.8); padding: 2rem; border-radius: 15px; border: 2px solid rgba(102, 126, 234, 0.1); margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem; color: #333;">Profile Completion</h3>
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="font-weight: 600; color: #333;">Progress</span>
                            <span style="font-weight: bold; color: ${color};">${completion}% - ${status}</span>
                        </div>
                        <div style="width: 100%; height: 10px; background: rgba(102, 126, 234, 0.1); border-radius: 10px; overflow: hidden;">
                            <div style="width: ${completion}%; height: 100%; background: linear-gradient(90deg, ${color}, ${color}aa); transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                </div>
                <div style="font-size: 0.9rem; color: #666;">
                    ${this.getCompletionTips(completion)}
                </div>
            </div>
        `;

        // Insert before the first existing div
        const firstDiv = profileSection.querySelector('div[style*="display: grid"]');
        if (firstDiv) {
            firstDiv.insertAdjacentHTML('beforebegin', widgetHTML);
        }
    }

    // Get completion tips based on current progress
    getCompletionTips(completion) {
        if (completion >= 80) {
            return 'Great job! Your profile is well-optimized to attract clients.';
        } else if (completion >= 60) {
            return 'Good progress! Consider adding more portfolio projects to showcase your skills.';
        } else if (completion >= 40) {
            return 'You\'re on the right track! Add a detailed bio and complete some projects to improve your profile.';
        } else {
            return 'Let\'s get started! Complete your basic information and add a professional bio to attract more clients.';
        }
    }

    // Export profile data
    exportProfile() {
        const userInfo = authManager.getCurrentUser();
        const profileData = {
            ...userInfo,
            ...this.profileData,
            exportDate: new Date().toISOString(),
            profileCompletion: this.calculateProfileCompletion()
        };

        const dataStr = JSON.stringify(profileData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `profile-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        window.URL.revokeObjectURL(url);
    }

    // Reset profile form
    resetProfileForm() {
        if (confirm('Are you sure you want to reset all changes? This will restore your last saved profile information.')) {
            this.loadProfileData();
        }
    }

    // Get current profile data
    getProfileData() {
        return this.profileData;
    }

    // Update specific profile field
    updateProfileField(field, value) {
        this.profileData[field] = value;
        authManager.updateUserProfile(this.profileData);
    }
}

// Create global profile manager instance
window.profileManager = new ProfileManager();