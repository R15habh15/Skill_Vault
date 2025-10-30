class ChatManager {
    constructor({ apiBase = '' } = {}) {
        this.apiBase = apiBase;
        this.socket = null;
        this.currentUser = null;
        this.currentContactId = null;

        // UI elements
        this.conversationsEl = document.getElementById('conversations-list');
        this.messagesEl = document.getElementById('chat-messages');
        this.chatHeaderEl = document.getElementById('chat-header');
        this.inputEl = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('send-message');
        this.newChatBtn = document.getElementById('new-chat-btn');
        this.searchInput = document.querySelector('.conversations-panel input[type="text"]');

        this.typingTimeout = null;
        this.typing = false;

        this.init();
    }

    init() {
        if (this.inputEl) {
            this.inputEl.disabled = true;
            this.inputEl.placeholder = 'Select a conversation to start typing...';
        }
        if (this.sendBtn) this.sendBtn.disabled = true;

        // Wait longer for auth to initialize and try multiple methods to get user
        setTimeout(() => {
            this.getCurrentUser();

            if (!this.currentUser || !this.currentUser.id) {
                console.warn('⚠️ User not authenticated, chat disabled');
                if (this.conversationsEl) {
                    this.conversationsEl.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;"><i class="fas fa-user-slash" style="font-size:2rem;opacity:0.3;"></i><p style="margin-top:1rem;">Please login to use chat</p></div>';
                }
                return;
            }

            console.log('✅ Chat initialized for user:', this.currentUser.username || this.currentUser.id);
            this.setupSocket();
            this.attachUIEvents();
            this.loadConversations();
        }, 1000);
    }

    getCurrentUser() {
        // Try multiple methods to get the current user

        // Method 1: From authManager
        if (window.authManager && typeof window.authManager.getCurrentUser === 'function') {
            this.currentUser = window.authManager.getCurrentUser();
            if (this.currentUser && this.currentUser.id) {
                console.log('✅ User from authManager:', this.currentUser);
                return;
            }
        }

        // Method 2: From localStorage
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                this.currentUser = JSON.parse(userInfo);
                console.log('✅ User from localStorage:', this.currentUser);
                return;
            } catch (e) {
                console.error('Failed to parse userInfo from localStorage');
            }
        }

        // Method 3: From global window object
        if (window.currentUser) {
            this.currentUser = window.currentUser;
            console.log('✅ User from window.currentUser:', this.currentUser);
            return;
        }

        console.error('❌ Could not find user from any source');
    }

    setupSocket() {
        if (typeof io === 'undefined') {
            console.warn('⚠️ Socket.IO client not found. Ensure /socket.io/socket.io.js is included.');
            return;
        }

        if (!this.currentUser?.id) {
            console.warn('⚠️ Cannot setup socket without user ID');
            return;
        }

        this.socket = io();
        const emitConnect = () => {
            if (this.currentUser?.id) {
                this.socket.emit('user_connected', String(this.currentUser.id));
                console.log('💬 Socket connected for user:', this.currentUser.id);
            }
        };
        emitConnect();

        // Real-time events
        this.socket.on('receiveMessage', (msg) => {
            const otherId = String(msg.sender_id === this.currentUser?.id ? msg.receiver_id : msg.sender_id);
            if (this.currentContactId && otherId === String(this.currentContactId)) {
                this.appendMessageToUI(msg, false);
                this.markMessagesRead();
            }
            this.loadConversations();
        });

        this.socket.on('message_sent', (msg) => {
            if (String(msg.sender_id) === String(this.currentUser?.id)) {
                this.appendMessageToUI(msg, true);
                this.loadConversations();
            }
        });

        this.socket.on('user_typing', ({ userId, isTyping }) => {
            if (String(userId) === String(this.currentContactId)) this.setTypingIndicator(isTyping);
        });

        this.socket.on('messages_read', ({ userId }) => {
            if (String(userId) === String(this.currentContactId)) this.loadConversations();
        });
    }

    attachUIEvents() {
        // Remove existing event listeners to prevent duplicates
        if (this._boundSendMessage) {
            if (this.sendBtn) this.sendBtn.removeEventListener('click', this._boundSendMessage);
        }
        if (this._boundKeydown) {
            if (this.inputEl) this.inputEl.removeEventListener('keydown', this._boundKeydown);
        }
        if (this._boundBlur) {
            if (this.inputEl) this.inputEl.removeEventListener('blur', this._boundBlur);
        }

        // Re-query elements in case they weren't available during construction
        this.newChatBtn = document.getElementById('new-chat-btn');
        this.searchInput = document.querySelector('.conversations-panel input[type="text"]');

        // Create bound functions for event listeners
        this._boundSendMessage = () => this.sendMessage();
        this._boundKeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            } else {
                this.emitTyping(true);
            }
        };
        this._boundBlur = () => this.emitTyping(false);

        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', this._boundSendMessage);
        }

        if (this.inputEl) {
            this.inputEl.addEventListener('keydown', this._boundKeydown);
            this.inputEl.addEventListener('blur', this._boundBlur);
        }

        if (this.newChatBtn) {
            console.log('✅ New chat button found, attaching event');
            this.newChatBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔵 New chat button clicked');
                this.openNewChatDialog();
            });
        } else {
            console.warn('⚠️ New chat button not found in DOM');
            // Try again after a short delay
            setTimeout(() => {
                this.newChatBtn = document.getElementById('new-chat-btn');
                if (this.newChatBtn) {
                    console.log('✅ New chat button found on retry');
                    this.newChatBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        console.log('🔵 New chat button clicked');
                        this.openNewChatDialog();
                    });
                }
            }, 1000);
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchConversations(e.target.value.trim());
            });
        }
    }

    async loadConversations() {
        if (!this.currentUser?.id) {
            this.getCurrentUser(); // Try to get user again
            if (!this.currentUser?.id) return;
        }

        if (this.conversationsEl) {
            this.conversationsEl.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i><p style="margin-top:1rem;">Loading conversations...</p></div>';
        }

        try {
            const res = await fetch(`${this.apiBase}/api/chat/conversations/${this.currentUser.id}`);
            const json = await res.json();
            if (json.success) {
                this.renderConversations(json.conversations);
            } else {
                if (this.conversationsEl) {
                    this.conversationsEl.innerHTML = '<div style="text-align:center;padding:2rem;color:#e53e3e;"><i class="fas fa-exclamation-triangle"></i><p style="margin-top:1rem;">Failed to load conversations</p></div>';
                }
            }
        } catch (err) {
            console.error('❌ Failed to load conversations:', err);
            if (this.conversationsEl) {
                this.conversationsEl.innerHTML = '<div style="text-align:center;padding:2rem;color:#e53e3e;"><i class="fas fa-exclamation-triangle"></i><p style="margin-top:1rem;">Error loading conversations</p></div>';
            }
        }
    }

    renderConversations(list = []) {
        if (!this.conversationsEl) return;
        this.conversationsEl.innerHTML = list.length
            ? ''
            : `<div style="text-align:center;padding:2rem;color:#999;">No conversations yet</div>`;

        list.forEach(c => {
            const el = document.createElement('div');
            el.className = 'conversation-item';
            el.style.cssText = 'padding:0.9rem 1rem;border-bottom:1px solid #eee;cursor:pointer;transition:background 0.2s;';
            el.innerHTML = `
                <div style="display:flex;justify-content:space-between;">
                    <div style="display:flex;gap:0.7rem;align-items:center;">
                        <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-weight:600;color:white;">
                            ${c.contact_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <div style="font-weight:600;color:#333;">${c.contact_name}</div>
                            <div style="font-size:0.85rem;color:#666;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.last_message || ''}</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:0.75rem;color:#999;">${c.last_message_time ? this.formatTime(c.last_message_time) : ''}</div>
                        ${c.unread_count > 0 ? `<div style="background:#e53e3e;color:white;border-radius:12px;padding:2px 8px;font-size:0.75rem;margin-top:4px;display:inline-block;">${c.unread_count}</div>` : ''}
                    </div>
                </div>`;
            el.addEventListener('mouseenter', () => el.style.background = '#f8f9fa');
            el.addEventListener('mouseleave', () => el.style.background = 'white');
            el.addEventListener('click', () => this.openConversation(c.contact_id, c.contact_name));
            this.conversationsEl.appendChild(el);
        });
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    async openConversation(id, name) {
        this.currentContactId = String(id);
        if (this.chatHeaderEl)
            this.chatHeaderEl.innerHTML = `
                <div style="display:flex;align-items:center;gap:0.7rem;">
                    <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-weight:600;color:white;">
                        ${name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div style="font-weight:700;color:#333;">${name}</div>
                        <div id="typing-indicator" style="font-size:0.85rem;color:#777;"></div>
                    </div>
                </div>`;

        if (this.inputEl) {
            this.inputEl.disabled = false;
            this.inputEl.placeholder = 'Type your message...';
            this.inputEl.focus();
        }
        if (this.sendBtn) this.sendBtn.disabled = false;

        this.messagesEl.innerHTML = `<div style="text-align:center;padding:2rem;color:#999;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
        try {
            const res = await fetch(`${this.apiBase}/api/chat/messages/${this.currentUser.id}/${id}`);
            const json = await res.json();
            if (json.success) {
                this.renderMessages(json.messages);
                this.markMessagesRead();
            } else this.messagesEl.innerHTML = '<div style="text-align:center;padding:2rem;color:#e53e3e;">Failed to load messages</div>';
        } catch (err) {
            this.messagesEl.innerHTML = '<div style="text-align:center;padding:2rem;color:#e53e3e;">Error loading messages</div>';
            console.error(err);
        }
    }

    renderMessages(messages = []) {
        this.messagesEl.innerHTML = '';
        if (messages.length === 0) {
            this.messagesEl.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">No messages yet. Start the conversation!</div>';
            return;
        }
        messages.forEach(m => this.appendMessageToUI(m, String(m.sender_id) === String(this.currentUser.id)));
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }

    appendMessageToUI(m, mine) {
        const wrap = document.createElement('div');
        wrap.style.cssText = `margin:8px 0;display:flex;justify-content:${mine ? 'flex-end' : 'flex-start'};`;
        const bubble = document.createElement('div');
        bubble.style.cssText = `
            max-width:70%;padding:0.7rem 1rem;border-radius:${mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
            background:${mine ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#fff'};
            color:${mine ? '#fff' : '#333'};
            box-shadow:0 2px 8px rgba(0,0,0,0.1);
            word-wrap:break-word;
        `;
        bubble.innerHTML = `<div style="line-height:1.5;">${this.escapeHtml(m.message)}</div>
            <div style="font-size:0.7rem;text-align:right;margin-top:4px;opacity:0.8;">
                ${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>`;
        wrap.appendChild(bubble);
        this.messagesEl.appendChild(wrap);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }

    escapeHtml(t = '') {
        return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    async sendMessage() {
        const text = this.inputEl.value.trim();
        if (!text || !this.currentContactId) return;
        const data = { senderId: this.currentUser.id, receiverId: this.currentContactId, message: text };

        if (this.socket?.connected) {
            this.socket.emit('sendMessage', data);
        } else {
            console.warn('Socket not connected. Sending via POST as fallback.');
            try {
                const res = await fetch(`${this.apiBase}/api/chat/send`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
                });
                const json = await res.json();
                if (json.success) {
                    this.appendMessageToUI(json.message, true);
                    this.loadConversations();
                }
            } catch (err) {
                console.error('Error sending message via POST:', err);
            }
        }

        this.inputEl.value = '';
        this.emitTyping(false);
    }

    emitTyping(isTyping) {
        if (!this.socket || !this.currentContactId) return;
        if (isTyping) {
            if (!this.typing) {
                this.typing = true;
                this.socket.emit('typing', { senderId: this.currentUser.id, receiverId: this.currentContactId, isTyping: true });
            }
            clearTimeout(this.typingTimeout);
            this.typingTimeout = setTimeout(() => {
                this.typing = false;
                this.socket.emit('typing', { senderId: this.currentUser.id, receiverId: this.currentContactId, isTyping: false });
            }, 1200);
        } else {
            this.typing = false;
            this.socket.emit('typing', { senderId: this.currentUser.id, receiverId: this.currentContactId, isTyping: false });
        }
    }

    setTypingIndicator(v) {
        const el = document.getElementById('typing-indicator');
        if (el) el.textContent = v ? 'Typing…' : '';
    }

    async markMessagesRead() {
        if (!this.currentContactId || !this.currentUser?.id) return;
        await fetch(`${this.apiBase}/api/chat/mark-read/${this.currentUser.id}/${this.currentContactId}`, { method: 'PUT' });
        if (this.socket) this.socket.emit('mark_read', { userId: this.currentUser.id, contactId: this.currentContactId });
        this.loadConversations();
    }

    async openNewChatDialog() {
        console.log('🚀 Opening new chat dialog');

        if (!this.currentUser || !this.currentUser.id) {
            alert('Please login to start a chat');
            return;
        }

        // Create a better modal for searching users
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';

        modal.innerHTML = `
            <div style="background:white;padding:2rem;border-radius:15px;max-width:500px;width:90%;box-shadow:0 10px 30px rgba(0,0,0,0.3);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                    <h3 style="margin:0;color:#333;"><i class="fas fa-search"></i> Search Users</h3>
                    <button id="close-search-modal" style="background:none;border:none;font-size:1.5rem;color:#999;cursor:pointer;">&times;</button>
                </div>
                <input type="text" id="user-search-input" placeholder="Search by name or email..." 
                       style="width:100%;padding:0.8rem;border:1px solid #ddd;border-radius:8px;font-size:0.95rem;margin-bottom:1rem;">
                <div id="search-results" style="max-height:300px;overflow-y:auto;">
                    <div style="text-align:center;padding:2rem;color:#999;">
                        <i class="fas fa-search" style="font-size:2rem;opacity:0.3;"></i>
                        <p style="margin-top:1rem;">Type to search for users</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const searchInput = modal.querySelector('#user-search-input');
        const searchResults = modal.querySelector('#search-results');
        const closeBtn = modal.querySelector('#close-search-modal');

        closeBtn.onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 2) {
                searchResults.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;"><i class="fas fa-search" style="font-size:2rem;opacity:0.3;"></i><p style="margin-top:1rem;">Type at least 2 characters</p></div>';
                return;
            }

            searchResults.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;"><i class="fas fa-spinner fa-spin"></i><p style="margin-top:1rem;">Searching...</p></div>';

            searchTimeout = setTimeout(async () => {
                try {
                    const res = await fetch(`${this.apiBase}/api/chat/search-users/${encodeURIComponent(query)}?userId=${this.currentUser.id}`);
                    const json = await res.json();

                    if (json.success && json.users.length > 0) {
                        searchResults.innerHTML = '';
                        json.users.forEach(user => {
                            const userEl = document.createElement('div');
                            userEl.style.cssText = 'padding:1rem;border-bottom:1px solid #eee;cursor:pointer;transition:background 0.2s;display:flex;align-items:center;gap:1rem;';
                            userEl.innerHTML = `
                                <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-weight:600;color:white;">
                                    ${user.username?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div style="flex:1;">
                                    <div style="font-weight:600;color:#333;">${user.username}</div>
                                    <div style="font-size:0.85rem;color:#666;">${user.email}</div>
                                    <div style="font-size:0.75rem;color:#999;text-transform:capitalize;">${user.user_type}</div>
                                </div>
                            `;
                            userEl.addEventListener('mouseenter', () => userEl.style.background = '#f8f9fa');
                            userEl.addEventListener('mouseleave', () => userEl.style.background = 'white');
                            userEl.addEventListener('click', () => {
                                this.openConversation(user.id, user.username);
                                modal.remove();
                            });
                            searchResults.appendChild(userEl);
                        });
                    } else {
                        searchResults.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;"><i class="fas fa-user-slash" style="font-size:2rem;opacity:0.3;"></i><p style="margin-top:1rem;">No users found</p></div>';
                    }
                } catch (err) {
                    console.error('Search error:', err);
                    searchResults.innerHTML = '<div style="text-align:center;padding:2rem;color:#e53e3e;"><i class="fas fa-exclamation-triangle"></i><p style="margin-top:1rem;">Search failed</p></div>';
                }
            }, 300);
        });

        searchInput.focus();
    }

    async searchConversations(query) {
        if (!query || !this.conversationsEl) {
            this.loadConversations();
            return;
        }

        // Filter existing conversations by name
        const allConversations = Array.from(this.conversationsEl.querySelectorAll('.conversation-item'));
        allConversations.forEach(conv => {
            const name = conv.textContent.toLowerCase();
            if (name.includes(query.toLowerCase())) {
                conv.style.display = 'block';
            } else {
                conv.style.display = 'none';
            }
        });
    }

    // Cleanup method to prevent memory leaks
    destroy() {
        // Remove event listeners
        if (this._boundSendMessage && this.sendBtn) {
            this.sendBtn.removeEventListener('click', this._boundSendMessage);
        }
        if (this._boundKeydown && this.inputEl) {
            this.inputEl.removeEventListener('keydown', this._boundKeydown);
        }
        if (this._boundBlur && this.inputEl) {
            this.inputEl.removeEventListener('blur', this._boundBlur);
        }

        // Disconnect socket
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        // Clear references
        this.currentUser = null;
        this.currentContactId = null;
        
        console.log('✅ ChatManager cleaned up');
    }
}

// Make ChatManager available globally
window.ChatManager = ChatManager;
