// Notifications Management
class NotificationsManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.isVisible = false;
        this.init();
    }

    init() {
        this.createNotificationUI();
        this.loadNotifications();
        this.setupEventListeners();
        this.startPolling();
    }

    // Create notification UI elements
    createNotificationUI() {
        // Add notification bell to navbar
        const navUser = document.querySelector('.nav-user');
        if (navUser && !document.getElementById('notification-bell')) {
            const notificationBell = document.createElement('div');
            notificationBell.id = 'notification-bell';
            notificationBell.style.cssText = `
                position: relative;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 50%;
                transition: all 0.3s ease;
                margin-right: 0.5rem;
            `;
            
            notificationBell.innerHTML = `
                <i class="fas fa-bell" style="font-size: 1.2rem; color: white;"></i>
                <span id="notification-badge" style="
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: #ff4444;
                    color: white;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                    font-size: 0.7rem;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                ">0</span>
            `;
            
            notificationBell.addEventListener('click', () => this.toggleNotificationPanel());
            navUser.insertBefore(notificationBell, navUser.firstChild);
        }

        // Create notification panel
        if (!document.getElementById('notification-panel')) {
            const panel = document.createElement('div');
            panel.id = 'notification-panel';
            panel.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                width: 350px;
                max-height: 500px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                z-index: 1500;
                display: none;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid rgba(102, 126, 234, 0.2);
            `;
            
            panel.innerHTML = `
                <div style="padding: 1rem; border-bottom: 1px solid #eee; background: #f8f9fa;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; color: #333;">Notifications</h3>
                        <div style="display: flex; gap: 0.5rem;">
                            <button id="mark-all-read" style="background: none; border: none; color: #667eea; cursor: pointer; font-size: 0.8rem;">Mark all read</button>
                            <button id="close-notifications" style="background: none; border: none; color: #999; cursor: pointer;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div id="notifications-list" style="flex: 1; overflow-y: auto; max-height: 400px;">
                    <div style="padding: 2rem; text-align: center; color: #666;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <p>Loading notifications...</p>
                    </div>
                </div>
            `;
            
            document.body.appendChild(panel);
            
            // Add event listeners
            document.getElementById('close-notifications').addEventListener('click', () => this.hideNotificationPanel());
            document.getElementById('mark-all-read').addEventListener('click', () => this.markAllAsRead());
            
            // Close panel when clicking outside
            document.addEventListener('click', (e) => {
                if (!panel.contains(e.target) && !document.getElementById('notification-bell').contains(e.target)) {
                    this.hideNotificationPanel();
                }
            });
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen for notification events from other parts of the app
        document.addEventListener('notification-created', (e) => {
            this.addNotification(e.detail);
        });
    }

    // Load notifications from backend
    async loadNotifications() {
        const userInfo = authManager.getCurrentUser();
        if (!userInfo || !userInfo.id) return;

        try {
            const response = await fetch(`/api/notifications/${userInfo.id}?limit=50`);
            const data = await response.json();
            
            if (data.success) {
                this.notifications = data.notifications;
                this.unreadCount = data.unreadCount;
                this.updateBadge();
                this.renderNotifications();
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.renderNotifications(); // Show empty state
        }
    }

    // Create notification
    async createNotification(type, title, message, data = {}, priority = 'normal') {
        const userInfo = authManager.getCurrentUser();
        if (!userInfo || !userInfo.id) return;

        try {
            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userInfo.id,
                    type,
                    title,
                    message,
                    data,
                    priority
                })
            });
            
            const result = await response.json();
            if (result.success) {
                this.notifications.unshift(result.notification);
                this.unreadCount++;
                this.updateBadge();
                this.renderNotifications();
                this.showToast(title, message, type);
            }
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    // Mark notification as read
    async markAsRead(notificationId) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH'
            });
            
            if (response.ok) {
                const notification = this.notifications.find(n => n.id === notificationId);
                if (notification && !notification.is_read) {
                    notification.is_read = true;
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                    this.updateBadge();
                    this.renderNotifications();
                }
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    // Mark all notifications as read
    async markAllAsRead() {
        const userInfo = authManager.getCurrentUser();
        if (!userInfo || !userInfo.id) return;

        try {
            const response = await fetch(`/api/notifications/${userInfo.id}/read-all`, {
                method: 'PATCH'
            });
            
            if (response.ok) {
                this.notifications.forEach(n => n.is_read = true);
                this.unreadCount = 0;
                this.updateBadge();
                this.renderNotifications();
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }

    // Delete notification
    async deleteNotification(notificationId) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                const index = this.notifications.findIndex(n => n.id === notificationId);
                if (index !== -1) {
                    const notification = this.notifications[index];
                    if (!notification.is_read) {
                        this.unreadCount = Math.max(0, this.unreadCount - 1);
                    }
                    this.notifications.splice(index, 1);
                    this.updateBadge();
                    this.renderNotifications();
                }
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }

    // Update notification badge
    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // Render notifications in panel
    renderNotifications() {
        const container = document.getElementById('notifications-list');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #666;">
                    <i class="fas fa-bell-slash" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.notifications.map(notification => `
            <div class="notification-item" data-id="${notification.id}" style="
                padding: 1rem;
                border-bottom: 1px solid #eee;
                cursor: pointer;
                transition: background 0.2s ease;
                ${!notification.is_read ? 'background: #f0f8ff; border-left: 3px solid #667eea;' : ''}
            " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='${!notification.is_read ? '#f0f8ff' : 'white'}'">
                <div style="display: flex; justify-content: between; align-items: start; gap: 0.5rem;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem;">
                            <i class="fas fa-${this.getNotificationIcon(notification.type)}" style="color: ${this.getNotificationColor(notification.type)};"></i>
                            <strong style="color: #333; font-size: 0.9rem;">${notification.title}</strong>
                            ${!notification.is_read ? '<div style="width: 8px; height: 8px; background: #667eea; border-radius: 50%;"></div>' : ''}
                        </div>
                        <p style="color: #666; font-size: 0.8rem; margin: 0; line-height: 1.4;">${notification.message}</p>
                        <div style="color: #999; font-size: 0.7rem; margin-top: 0.3rem;">
                            ${this.formatDate(notification.created_at)}
                        </div>
                    </div>
                    <button onclick="event.stopPropagation(); window.notificationsManager.deleteNotification(${notification.id})" style="
                        background: none;
                        border: none;
                        color: #999;
                        cursor: pointer;
                        padding: 0.2rem;
                        border-radius: 3px;
                    " onmouseover="this.style.color='#dc3545'" onmouseout="this.style.color='#999'">
                        <i class="fas fa-times" style="font-size: 0.8rem;"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add click handlers for notifications
        container.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                const notificationId = parseInt(item.dataset.id);
                this.handleNotificationClick(notificationId);
            });
        });
    }

    // Handle notification click
    handleNotificationClick(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (!notification) return;

        // Mark as read if unread
        if (!notification.is_read) {
            this.markAsRead(notificationId);
        }

        // Handle different notification types
        switch (notification.type) {
            case 'job_match':
                window.navigationManager?.showSection('jobs');
                break;
            case 'payment':
            case 'withdrawal':
                window.navigationManager?.showSection('credits');
                break;
            case 'project_update':
                window.navigationManager?.showSection('projects');
                break;
            case 'application_status':
                window.navigationManager?.showSection('applications');
                break;
        }

        this.hideNotificationPanel();
    }

    // Get notification icon based on type
    getNotificationIcon(type) {
        const icons = {
            job_match: 'briefcase',
            payment: 'credit-card',
            project_update: 'tasks',
            message: 'envelope',
            system: 'info-circle',
            withdrawal: 'money-bill-wave',
            application_status: 'file-alt'
        };
        return icons[type] || 'bell';
    }

    // Get notification color based on type
    getNotificationColor(type) {
        const colors = {
            job_match: '#667eea',
            payment: '#28a745',
            project_update: '#ffc107',
            message: '#17a2b8',
            system: '#6c757d',
            withdrawal: '#28a745',
            application_status: '#fd7e14'
        };
        return colors[type] || '#667eea';
    }

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    // Show notification panel
    showNotificationPanel() {
        const panel = document.getElementById('notification-panel');
        if (panel) {
            panel.style.display = 'flex';
            this.isVisible = true;
        }
    }

    // Hide notification panel
    hideNotificationPanel() {
        const panel = document.getElementById('notification-panel');
        if (panel) {
            panel.style.display = 'none';
            this.isVisible = false;
        }
    }

    // Toggle notification panel
    toggleNotificationPanel() {
        if (this.isVisible) {
            this.hideNotificationPanel();
        } else {
            this.showNotificationPanel();
        }
    }

    // Show toast notification
    showToast(title, message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-left: 4px solid ${this.getNotificationColor(type)};
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 1rem;
            max-width: 300px;
            z-index: 2000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        toast.innerHTML = `
            <div style="display: flex; align-items: start; gap: 0.5rem;">
                <i class="fas fa-${this.getNotificationIcon(type)}" style="color: ${this.getNotificationColor(type)}; margin-top: 0.2rem;"></i>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #333; margin-bottom: 0.3rem;">${title}</div>
                    <div style="color: #666; font-size: 0.9rem; line-height: 1.4;">${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #999; cursor: pointer; padding: 0;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    // Start polling for new notifications
    startPolling() {
        setInterval(() => {
            this.loadNotifications();
        }, 30000); // Poll every 30 seconds
    }

    // Public methods for creating specific notification types
    notifyJobMatch(jobTitle, company) {
        this.createNotification(
            'job_match',
            'New Job Match!',
            `A new job "${jobTitle}" at ${company} matches your skills.`,
            { jobTitle, company },
            'normal'
        );
    }

    notifyPayment(amount, type = 'received') {
        this.createNotification(
            'payment',
            type === 'received' ? 'Payment Received' : 'Payment Sent',
            `You ${type} ₹${amount} in VCredits.`,
            { amount, type },
            'normal'
        );
    }

    notifyWithdrawal(amount, status) {
        this.createNotification(
            'withdrawal',
            'Withdrawal Update',
            `Your withdrawal of ₹${amount} is ${status}.`,
            { amount, status },
            status === 'completed' ? 'high' : 'normal'
        );
    }

    notifyApplicationStatus(jobTitle, status) {
        this.createNotification(
            'application_status',
            'Application Update',
            `Your application for "${jobTitle}" is ${status}.`,
            { jobTitle, status },
            'normal'
        );
    }
}

// Create global notifications manager instance
window.notificationsManager = new NotificationsManager();