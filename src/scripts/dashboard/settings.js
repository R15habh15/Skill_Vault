// Settings Management
class SettingsManager {
    constructor() {
        this.settings = {
            notifications: {
                emailJobMatches: true,
                paymentNotifications: true
            },
            preferences: {
                language: 'en',
                currency: 'INR'
            }
        };
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.renderSettingsUI();
    }

    setupEventListeners() {
        // Settings form changes
        document.addEventListener('change', (e) => {
            if (e.target.matches('#settings input[type="checkbox"]')) {
                this.handleNotificationChange(e.target);
            }
        });

        // Settings buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="download-data"]')) {
                this.downloadUserData();
            } else if (e.target.matches('[data-action="delete-account"]')) {
                this.deleteAccount();
            } else if (e.target.matches('[data-action="export-settings"]')) {
                this.exportSettings();
            } else if (e.target.matches('[data-action="reset-settings"]')) {
                this.resetSettings();
            }
        });
    }

    // Load settings from backend
    async loadSettings() {
        const userInfo = authManager.getCurrentUser();
        if (!userInfo || !userInfo.id) {
            console.log('No user info available, using default settings');
            return;
        }

        try {
            const response = await fetch(`/api/settings/${userInfo.id}`);
            const data = await response.json();
            
            if (data.success) {
                this.settings = { ...this.settings, ...data.settings };
                console.log('Settings loaded from backend');
            } else {
                console.error('Failed to load settings:', data.message);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            // Fallback to localStorage
            const savedSettings = localStorage.getItem('userSettings');
            if (savedSettings) {
                try {
                    this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
                } catch (parseError) {
                    console.error('Error parsing local settings:', parseError);
                }
            }
        }
    }

    // Save settings to backend
    async saveSettings() {
        const userInfo = authManager.getCurrentUser();
        if (!userInfo || !userInfo.id) {
            // Fallback to localStorage if no user
            localStorage.setItem('userSettings', JSON.stringify(this.settings));
            this.showNotification('Settings saved locally!', 'success');
            return;
        }

        try {
            const response = await fetch(`/api/settings/${userInfo.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ settings: this.settings })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Settings saved successfully!', 'success');
                // Also save to localStorage as backup
                localStorage.setItem('userSettings', JSON.stringify(this.settings));
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            // Fallback to localStorage
            localStorage.setItem('userSettings', JSON.stringify(this.settings));
            this.showNotification('Settings saved locally (server unavailable)', 'warning');
        }
    }

    // Handle notification setting changes
    handleNotificationChange(checkbox) {
        const settingName = checkbox.name;
        const isChecked = checkbox.checked;
        
        if (settingName in this.settings.notifications) {
            this.settings.notifications[settingName] = isChecked;
            this.saveSettings();
        }
    }

    // Render basic settings UI
    renderSettingsUI() {
        const settingsSection = document.getElementById('settings');
        if (!settingsSection) return;

        // Clear existing content except header
        const header = settingsSection.querySelector('.section-header');
        settingsSection.innerHTML = '';
        if (header) {
            settingsSection.appendChild(header);
        }

        const settingsHTML = `
            <div style="display: grid; gap: 2rem;">
                <!-- Basic Notifications -->
                <div style="background: rgba(255, 255, 255, 0.8); padding: 2rem; border-radius: 15px; border: 2px solid rgba(102, 126, 234, 0.1);">
                    <h3 style="margin-bottom: 1rem; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-bell"></i> Notifications
                    </h3>
                    <div style="display: grid; gap: 1rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" name="emailJobMatches" ${this.settings.notifications.emailJobMatches ? 'checked' : ''}>
                            <span>Email notifications for new jobs</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" name="paymentNotifications" ${this.settings.notifications.paymentNotifications ? 'checked' : ''}>
                            <span>Payment notifications</span>
                        </label>
                    </div>
                </div>

                <!-- Basic Preferences -->
                <div style="background: rgba(255, 255, 255, 0.8); padding: 2rem; border-radius: 15px; border: 2px solid rgba(102, 126, 234, 0.1);">
                    <h3 style="margin-bottom: 1rem; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-cog"></i> Preferences
                    </h3>
                    <div style="display: grid; gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">Language</label>
                            <select class="form-select" name="language" onchange="window.settingsManager.updatePreference('language', this.value)">
                                <option value="en" ${this.settings.preferences.language === 'en' ? 'selected' : ''}>English</option>
                                <option value="hi" ${this.settings.preferences.language === 'hi' ? 'selected' : ''}>Hindi</option>
                                <option value="es" ${this.settings.preferences.language === 'es' ? 'selected' : ''}>Spanish</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">Currency</label>
                            <select class="form-select" name="currency" onchange="window.settingsManager.updatePreference('currency', this.value)">
                                <option value="INR" ${this.settings.preferences.currency === 'INR' ? 'selected' : ''}>INR (₹)</option>
                                <option value="USD" ${this.settings.preferences.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                                <option value="EUR" ${this.settings.preferences.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Account Management -->
                <div style="background: rgba(255, 255, 255, 0.8); padding: 2rem; border-radius: 15px; border: 2px solid rgba(102, 126, 234, 0.1);">
                    <h3 style="margin-bottom: 1rem; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-user-cog"></i> Account
                    </h3>
                    <div style="display: grid; gap: 1rem;">
                        <button class="apply-btn" onclick="window.settingsManager.changePassword()" style="background: #667eea;">
                            <i class="fas fa-key"></i> Change Password
                        </button>
                        <button class="apply-btn" data-action="download-data" style="background: #28a745;">
                            <i class="fas fa-download"></i> Download My Data
                        </button>
                        <div style="border-top: 1px solid rgba(0,0,0,0.1); padding-top: 1rem; margin-top: 1rem;">
                            <button class="apply-btn" data-action="delete-account" style="background: #dc3545;">
                                <i class="fas fa-trash-alt"></i> Delete Account
                            </button>
                            <p style="color: #666; font-size: 0.8rem; margin-top: 0.5rem;">
                                This action cannot be undone
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Help & Support -->
                <div style="background: rgba(255, 255, 255, 0.8); padding: 2rem; border-radius: 15px; border: 2px solid rgba(102, 126, 234, 0.1);">
                    <h3 style="margin-bottom: 1rem; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-question-circle"></i> Help & Support
                    </h3>
                    <div style="display: grid; gap: 1rem;">
                        <button class="apply-btn" onclick="window.settingsManager.contactSupport()" style="background: #17a2b8;">
                            <i class="fas fa-headset"></i> Contact Support
                        </button>
                        <button class="apply-btn" onclick="window.settingsManager.viewFAQ()" style="background: #6c757d;">
                            <i class="fas fa-book"></i> FAQ & Help Center
                        </button>
                    </div>
                </div>
            </div>
        `;

        settingsSection.insertAdjacentHTML('beforeend', settingsHTML);
    }

    // Update privacy setting
    updatePrivacySetting(setting, value) {
        this.settings.privacy[setting] = value;
        this.saveSettings();
    }

    // Update preference
    updatePreference(preference, value) {
        this.settings.preferences[preference] = value;
        this.saveSettings();
        
        // Apply theme change immediately
        if (preference === 'theme') {
            this.applyTheme(value);
        }
    }

    // Apply theme
    applyTheme(theme) {
        // This would implement theme switching
        console.log(`Applying theme: ${theme}`);
        // In a real app, you'd modify CSS variables or classes here
    }

    // Download user data
    async downloadUserData() {
        const userInfo = authManager.getCurrentUser();
        if (!userInfo || !userInfo.id) {
            alert('Please log in to download your data');
            return;
        }

        try {
            const response = await fetch(`/api/download-data/${userInfo.id}`);
            const result = await response.json();
            
            if (result.success) {
                // Combine backend data with local data
                const completeUserData = {
                    ...result.data,
                    localData: {
                        applications: JSON.parse(localStorage.getItem('userApplications') || '[]'),
                        proposals: JSON.parse(localStorage.getItem('userProposals') || '[]'),
                        activeProjects: JSON.parse(localStorage.getItem('userActiveProjects') || '[]'),
                        pastProjects: JSON.parse(localStorage.getItem('userPastProjects') || '[]'),
                        earnings: JSON.parse(localStorage.getItem('userEarnings') || '{}'),
                        transactions: JSON.parse(localStorage.getItem('userTransactions') || '[]')
                    }
                };

                const dataStr = JSON.stringify(completeUserData, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `skillvault-data-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                
                window.URL.revokeObjectURL(url);
                this.showNotification('Your data has been downloaded successfully!', 'success');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error downloading data:', error);
            // Fallback to local data only
            const localData = {
                profile: authManager.getUserProfile(),
                userInfo: authManager.getCurrentUser(),
                applications: JSON.parse(localStorage.getItem('userApplications') || '[]'),
                proposals: JSON.parse(localStorage.getItem('userProposals') || '[]'),
                activeProjects: JSON.parse(localStorage.getItem('userActiveProjects') || '[]'),
                pastProjects: JSON.parse(localStorage.getItem('userPastProjects') || '[]'),
                earnings: JSON.parse(localStorage.getItem('userEarnings') || '{}'),
                transactions: JSON.parse(localStorage.getItem('userTransactions') || '[]'),
                settings: this.settings,
                exportDate: new Date().toISOString(),
                note: 'Local data only - server unavailable'
            };

            const dataStr = JSON.stringify(localData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `skillvault-local-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            window.URL.revokeObjectURL(url);
            this.showNotification('Local data downloaded (server unavailable)', 'warning');
        }
    }

    // Export settings
    exportSettings() {
        const settingsData = {
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(settingsData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `skillvault-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        window.URL.revokeObjectURL(url);
        this.showNotification('Settings exported successfully!', 'success');
    }

    // Reset settings
    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
            // Reset to default settings
            this.settings = {
                notifications: {
                    emailJobMatches: true,
                    paymentNotifications: true
                },
                preferences: {
                    language: 'en',
                    currency: 'INR'
                }
            };

            localStorage.removeItem('userSettings');
            this.renderSettingsUI();
            this.showNotification('Settings have been reset to default!', 'success');
        }
    }

    // Delete account
    async deleteAccount() {
        const userInfo = authManager.getCurrentUser();
        if (!userInfo || !userInfo.id) {
            alert('Please log in to delete your account');
            return;
        }

        const confirmation = prompt('This action cannot be undone. Type "DELETE" to confirm account deletion:');
        
        if (confirmation === 'DELETE') {
            const password = prompt('Please enter your password to confirm account deletion:');
            if (!password) {
                alert('Password required for account deletion');
                return;
            }

            if (confirm('Are you absolutely sure? This will permanently delete all your data from our servers.')) {
                try {
                    const response = await fetch(`/api/delete-account/${userInfo.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            confirmPassword: password
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        // Clear all local data
                        const keysToRemove = [
                            'userInfo', 'userProfile', 'userApplications', 'userProposals',
                            'userActiveProjects', 'userPastProjects', 'userEarnings',
                            'userTransactions', 'userSettings', 'userCredits',
                            'freelancerTransactions'
                        ];
                        
                        keysToRemove.forEach(key => localStorage.removeItem(key));
                        
                        alert('Your account has been permanently deleted. You will now be redirected to the home page.');
                        window.location.href = '/';
                    } else {
                        alert(data.message || 'Failed to delete account');
                    }
                } catch (error) {
                    console.error('Error deleting account:', error);
                    alert('Failed to delete account. Please try again or contact support.');
                }
            }
        } else if (confirmation !== null) {
            alert('Account deletion cancelled. Please type "DELETE" exactly to confirm.');
        }
    }

    // Change password
    changePassword() {
        const modalContent = `
            <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 400px; margin: 2rem auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3); position: relative;">
                <button id="close-modal-btn" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 20px; color: #999; cursor: pointer; padding: 5px; line-height: 1; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s ease;">
                    <i class="fas fa-times"></i>
                </button>
                <h2 style="color: #333; margin-bottom: 1rem; padding-right: 40px;">Change Password</h2>
                <form id="password-form" data-no-prevent>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">Current Password</label>
                        <input type="password" id="current-password" class="form-input" required>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">New Password</label>
                        <input type="password" id="new-password" class="form-input" required>
                    </div>
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">Confirm New Password</label>
                        <input type="password" id="confirm-password" class="form-input" required>
                    </div>
                    <div style="display: flex; justify-content: center;">
                        <button type="submit" class="apply-btn" style="width: 100%;">Update Password</button>
                    </div>
                </form>
            </div>
        `;

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 2000;
            display: flex; align-items: center; justify-content: center;
        `;
        overlay.innerHTML = modalContent;

        // Add modal to DOM first
        document.body.appendChild(overlay);

        // Now add event listeners after modal is in DOM
        const closeBtn = overlay.querySelector('#close-modal-btn');
        const passwordForm = overlay.querySelector('#password-form');

        // Add close button functionality
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                overlay.remove();
            });
            
            // Add hover effects for close button
            closeBtn.addEventListener('mouseenter', () => {
                closeBtn.style.backgroundColor = '#f0f0f0';
            });
            
            closeBtn.addEventListener('mouseleave', () => {
                closeBtn.style.backgroundColor = 'transparent';
            });
        }
        
        // Close modal when clicking outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        const self = this; // Store reference to settings manager
        
        // Add form submission handler
        if (passwordForm) {
            const submitBtn = passwordForm.querySelector('button[type="submit"]');
            
            // Add click event to submit button
            if (submitBtn) {
                submitBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await handlePasswordChange();
                });
            }
            
            // Also add form submit event as backup
            passwordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handlePasswordChange();
            });
            
            // Define the password change handler function
            async function handlePasswordChange() {
            
            const currentPasswordInput = document.getElementById('current-password');
            const newPasswordInput = document.getElementById('new-password');
            const confirmPasswordInput = document.getElementById('confirm-password');
            
            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (newPassword !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            
            if (newPassword.length < 6) {
                alert('Password must be at least 6 characters long!');
                return;
            }
            
            const userInfo = authManager.getCurrentUser();
            if (!userInfo || !userInfo.id) {
                alert('Please log in to change password');
                return;
            }

            try {
                const response = await fetch('/api/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: userInfo.id,
                        currentPassword: currentPassword,
                        newPassword: newPassword
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Show success dialog box
                    alert('Password successfully changed!');
                    
                    // Clear the form
                    currentPasswordInput.value = '';
                    newPasswordInput.value = '';
                    confirmPasswordInput.value = '';
                    
                    // Close the modal
                    overlay.remove();
                } else {
                    // Show error dialog for incorrect current password or other errors
                    alert(data.message || 'Failed to update password');
                }
            } catch (error) {
                console.error('Error changing password:', error);
                alert('Failed to update password. Please try again.');
            }
            }
        }
    }

    // Contact support
    contactSupport() {
        const modalContent = `
            <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 500px; margin: 2rem auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <h2 style="color: #333; margin-bottom: 1rem;">Contact Support</h2>
                <div style="margin-bottom: 2rem;">
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
                        <h4 style="color: #333; margin-bottom: 0.5rem;">📧 Email Support</h4>
                        <p style="color: #666; margin: 0;">support@skillvault.com</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
                        <h4 style="color: #333; margin-bottom: 0.5rem;">💬 Live Chat</h4>
                        <p style="color: #666; margin: 0;">Available 24/7 for urgent issues</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 10px;">
                        <h4 style="color: #333; margin-bottom: 0.5rem;">📞 Phone Support</h4>
                        <p style="color: #666; margin: 0;">+1-800-SKILLVAULT (Mon-Fri, 9AM-6PM)</p>
                    </div>
                </div>
                <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" class="apply-btn">Close</button>
            </div>
        `;

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 2000;
            display: flex; align-items: center; justify-content: center;
        `;
        overlay.innerHTML = modalContent;
        document.body.appendChild(overlay);
    }

    // View FAQ
    viewFAQ() {
        const modalContent = `
            <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 600px; margin: 2rem auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-height: 80vh; overflow-y: auto;">
                <h2 style="color: #333; margin-bottom: 1rem;">Frequently Asked Questions</h2>
                <div style="margin-bottom: 2rem;">
                    <div style="margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
                        <h4 style="color: #333; margin-bottom: 0.5rem;">How do I withdraw my VCredits?</h4>
                        <p style="color: #666; margin: 0;">Go to the Earnings section and use the withdrawal form. Minimum withdrawal is 10 VCredits.</p>
                    </div>
                    <div style="margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
                        <h4 style="color: #333; margin-bottom: 0.5rem;">How long does it take to process withdrawals?</h4>
                        <p style="color: #666; margin: 0;">Withdrawals are typically processed within 1-3 business days.</p>
                    </div>
                    <div style="margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
                        <h4 style="color: #333; margin-bottom: 0.5rem;">How do I apply for jobs?</h4>
                        <p style="color: #666; margin: 0;">Browse available jobs in the Jobs section and click "Apply Now" on jobs that match your skills.</p>
                    </div>
                    <div style="margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
                        <h4 style="color: #333; margin-bottom: 0.5rem;">Can I edit my profile?</h4>
                        <p style="color: #666; margin: 0;">Yes, go to the Profile section to update your information, skills, and bio.</p>
                    </div>
                    <div style="margin-bottom: 1.5rem;">
                        <h4 style="color: #333; margin-bottom: 0.5rem;">How do I track my project progress?</h4>
                        <p style="color: #666; margin: 0;">Use the Active Projects section to monitor ongoing work and update progress.</p>
                    </div>
                </div>
                <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" class="apply-btn">Close</button>
            </div>
        `;

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 2000;
            display: flex; align-items: center; justify-content: center;
        `;
        overlay.innerHTML = modalContent;
        document.body.appendChild(overlay);
    }

    // Show notification
    showNotification(message, type = 'info') {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Animate out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Get current settings
    getSettings() {
        return this.settings;
    }
}

// Create global settings manager instance
window.settingsManager = new SettingsManager();