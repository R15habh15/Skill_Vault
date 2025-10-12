// Authentication and User Management
class AuthManager {
    constructor() {
        this.userInfo = null;
        this.init();
    }

    init() {
        this.loadUserData();
    }

    // Load user data from localStorage and update the dashboard
    loadUserData() {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            
            if (userInfo) {
                this.userInfo = userInfo;
                
                // Update welcome message
                const welcomeMessage = document.getElementById('welcome-message');
                if (welcomeMessage) {
                    welcomeMessage.textContent = `Welcome back, ${userInfo.username}!`;
                }
                
                // Update profile name
                const profileName = document.getElementById('profile-name');
                if (profileName) {
                    profileName.textContent = userInfo.username || 'Freelancer';
                }
                
                // Update profile title based on user type
                const profileTitle = document.getElementById('profile-title');
                if (profileTitle) {
                    profileTitle.textContent = userInfo.userType === 'freelancer' ? 'Freelancer' : 'Professional';
                }
                
                // Update user avatar with first letter of username
                const userAvatars = document.querySelectorAll('.user-avatar i, .profile-avatar i');
                userAvatars.forEach(avatar => {
                    if (userInfo.username) {
                        avatar.className = '';
                        avatar.textContent = userInfo.username.charAt(0).toUpperCase();
                        avatar.style.fontSize = '1.5rem';
                        avatar.style.fontWeight = 'bold';
                    }
                });
                
            } else {
                // If no user data found, redirect to login
                console.log('No user data found, redirecting to login');
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // If there's an error, redirect to login
            window.location.href = '/login';
        }
    }

    // Check if user is logged in and is a freelancer
    checkUserAccess() {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            
            if (!userInfo) {
                // No user logged in, redirect to login
                window.location.href = '/login';
                return false;
            }
            
            if (userInfo.userType !== 'freelancer') {
                // User is not a freelancer, redirect to home
                alert('Access denied. This dashboard is for freelancers only.');
                window.location.href = '/';
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error checking user access:', error);
            window.location.href = '/login';
            return false;
        }
    }

    // Get current user info
    getCurrentUser() {
        return this.userInfo;
    }

    // Update user profile data
    updateUserProfile(profileData) {
        try {
            localStorage.setItem('userProfile', JSON.stringify(profileData));
            
            // Update the sidebar profile title if changed
            if (profileData.title) {
                const profileTitle = document.getElementById('profile-title');
                if (profileTitle) {
                    profileTitle.textContent = profileData.title;
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error updating profile:', error);
            return false;
        }
    }

    // Get user profile data
    getUserProfile() {
        try {
            return JSON.parse(localStorage.getItem('userProfile') || '{}');
        } catch (error) {
            console.error('Error getting profile:', error);
            return {};
        }
    }
}

// Logout function
function logout() {
    // Clear user data
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userCredits');
    localStorage.removeItem('freelancerTransactions');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userApplications');
    localStorage.removeItem('userProposals');
    localStorage.removeItem('userActiveProjects');
    localStorage.removeItem('userPastProjects');
    localStorage.removeItem('userEarnings');
    localStorage.removeItem('userTransactions');
    
    // Show logout message
    alert('You have been logged out successfully!');
    
    // Redirect to home page
    window.location.href = '/';
}

// Create global auth manager instance
const authManager = new AuthManager();