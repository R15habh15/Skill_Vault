// Hired Freelancers Management for Company Dashboard

class HiredFreelancersManager {
    constructor() {
        this.userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (this.userInfo && this.userInfo.user_type === 'company') {
            this.init();
        }
    }

    init() {
        this.loadHiredFreelancers();
        
        // Refresh every 60 seconds
        setInterval(() => this.loadHiredFreelancers(), 60000);
    }

    async loadHiredFreelancers() {
        if (!this.userInfo || this.userInfo.user_type !== 'company') return;

        const container = document.getElementById('hired-freelancers-container');
        if (!container) return;

        try {
            const response = await fetch(`/api/jobs/hired-freelancers/${this.userInfo.id}`);
            const data = await response.json();

            if (data.success) {
                this.displayFreelancers(data.freelancers, container);
            }
        } catch (err) {
            console.error('Error loading hired freelancers:', err);
            container.innerHTML = '<p style="text-align: center; color: #666;">Failed to load hired freelancers</p>';
        }
    }

    displayFreelancers(freelancers, container) {
        if (freelancers.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No hired freelancers yet</p>
                    <p style="font-size: 0.9rem;">Accept job applications to start working with freelancers</p>
                </div>
            `;
            return;
        }

        container.innerHTML = freelancers.map(freelancer => `
            <div class="freelancer-card" style="background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                            <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold;">
                                ${freelancer.freelancer_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 style="margin: 0; color: #333;">${freelancer.freelancer_name}</h3>
                                <p style="margin: 0; color: #666; font-size: 0.9rem;">
                                    <i class="fas fa-envelope"></i> ${freelancer.freelancer_email}
                                </p>
                            </div>
                        </div>
                    </div>
                    <span class="badge" style="background: ${this.getStatusColor(freelancer.status)}; color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem;">
                        ${freelancer.status}
                    </span>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <div>
                        <div style="font-size: 0.85rem; color: #666;">Total Projects</div>
                        <div style="font-size: 1.3rem; font-weight: bold; color: #667eea;">${freelancer.total_projects}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; color: #666;">Active</div>
                        <div style="font-size: 1.3rem; font-weight: bold; color: #ffc107;">${freelancer.active_projects}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; color: #666;">Completed</div>
                        <div style="font-size: 1.3rem; font-weight: bold; color: #28a745;">${freelancer.completed_projects}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; color: #666;">Credits Paid</div>
                        <div style="font-size: 1.3rem; font-weight: bold; color: #764ba2;">${freelancer.total_credits_paid}</div>
                    </div>
                    ${freelancer.average_rating > 0 ? `
                        <div>
                            <div style="font-size: 0.85rem; color: #666;">Rating</div>
                            <div style="font-size: 1.3rem; font-weight: bold; color: #ff9800;">
                                ${freelancer.average_rating.toFixed(1)} <i class="fas fa-star" style="font-size: 0.9rem;"></i>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div style="display: flex; gap: 0.5rem; font-size: 0.85rem; color: #666; margin-bottom: 1rem;">
                    <span><i class="fas fa-calendar-plus"></i> First hired: ${new Date(freelancer.first_hired_date).toLocaleDateString()}</span>
                    <span><i class="fas fa-calendar-check"></i> Last project: ${new Date(freelancer.last_project_date).toLocaleDateString()}</span>
                </div>

                ${freelancer.notes ? `
                    <div style="background: #fff3cd; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; border-left: 3px solid #ffc107;">
                        <strong style="font-size: 0.85rem;">Notes:</strong>
                        <p style="margin: 0.25rem 0 0 0; font-size: 0.9rem;">${freelancer.notes}</p>
                    </div>
                ` : ''}

                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button onclick="hiredFreelancersManager.viewFreelancerProjects(${freelancer.freelancer_id})" class="apply-btn" style="background: #667eea; font-size: 0.9rem;">
                        <i class="fas fa-briefcase"></i> View Projects
                    </button>
                    <button onclick="hiredFreelancersManager.addNotes(${freelancer.id}, '${freelancer.freelancer_name}')" class="apply-btn" style="background: #17a2b8; font-size: 0.9rem;">
                        <i class="fas fa-sticky-note"></i> Add Notes
                    </button>
                    <button onclick="hiredFreelancersManager.sendMessage(${freelancer.freelancer_id}, '${freelancer.freelancer_name}')" class="apply-btn" style="background: #28a745; font-size: 0.9rem;">
                        <i class="fas fa-envelope"></i> Message
                    </button>
                </div>
            </div>
        `).join('');
    }

    getStatusColor(status) {
        const colors = {
            active: '#28a745',
            inactive: '#6c757d',
            blocked: '#dc3545'
        };
        return colors[status] || '#6c757d';
    }

    viewFreelancerProjects(freelancerId) {
        alert('View freelancer projects - Coming soon!\nFreelancer ID: ' + freelancerId);
        // TODO: Implement freelancer projects view
    }

    addNotes(freelancerId, freelancerName) {
        const notes = prompt(`Add notes for ${freelancerName}:`);
        if (notes === null || notes.trim() === '') return;

        // TODO: Implement API call to save notes
        alert('Notes saved successfully!');
        this.loadHiredFreelancers();
    }

    sendMessage(freelancerId, freelancerName) {
        alert(`Message feature coming soon!\nSend message to: ${freelancerName}`);
        // TODO: Implement messaging system
    }
}

// Initialize when DOM is ready
let hiredFreelancersManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        hiredFreelancersManager = new HiredFreelancersManager();
        window.hiredFreelancersManager = hiredFreelancersManager;
    });
} else {
    hiredFreelancersManager = new HiredFreelancersManager();
    window.hiredFreelancersManager = hiredFreelancersManager;
}
