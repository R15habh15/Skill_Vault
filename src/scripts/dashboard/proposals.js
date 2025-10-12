// Proposals Management
class ProposalsManager {
    constructor() {
        this.proposals = [];
        this.init();
    }

    init() {
        this.loadProposals();
    }

    // Load user proposals
    loadProposals() {
        this.proposals = JSON.parse(localStorage.getItem('userProposals') || '[]');
        this.renderProposals();
    }

    // Render proposals to the container
    renderProposals() {
        const container = document.getElementById('proposals-container');
        if (!container) return;

        if (this.proposals.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-paper-plane" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <h3>No Proposals Sent</h3>
                    <p>Send your first proposal to get started!</p>
                    <button class="apply-btn" onclick="window.navigationManager.showSection('jobs')" style="margin-top: 1rem;">
                        <i class="fas fa-search"></i> Find Jobs
                    </button>
                </div>
            `;
            return;
        }

        // Sort proposals by date (newest first)
        const sortedProposals = [...this.proposals].sort((a, b) => 
            new Date(b.sentDate) - new Date(a.sentDate)
        );

        container.innerHTML = sortedProposals.map(proposal => `
            <div class="job-card">
                <div class="job-header">
                    <div>
                        <div class="job-title">${proposal.jobTitle}</div>
                        <div class="job-company">${proposal.company}</div>
                    </div>
                    <span class="status-badge status-${proposal.status.toLowerCase().replace(/\s+/g, '-')}">${proposal.status}</span>
                </div>
                <div class="job-description">
                    Proposed ${proposal.proposedAmount} • ${proposal.description}
                    ${proposal.timeline ? `<br><strong>Timeline:</strong> ${proposal.timeline}` : ''}
                </div>
                <div class="job-meta">
                    <span class="job-date">Sent: ${proposal.sentDate}</span>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="apply-btn" onclick="window.proposalsManager.viewProposal(${proposal.id})">View Proposal</button>
                        ${proposal.status === 'Awaiting Response' ? 
                            `<button class="apply-btn" style="background: #667eea;" onclick="window.proposalsManager.editProposal(${proposal.id})">Edit</button>` : 
                            ''
                        }
                    </div>
                </div>
            </div>
        `).join('');
    }

    // View proposal details
    viewProposal(proposalId) {
        const proposal = this.proposals.find(p => p.id === proposalId);
        if (!proposal) {
            alert('Proposal not found.');
            return;
        }

        const modalContent = `
            <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 700px; margin: 2rem auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-height: 80vh; overflow-y: auto;">
                <h2 style="color: #333; margin-bottom: 1rem;">Proposal Details</h2>
                
                <div style="margin-bottom: 1rem;">
                    <strong>Job Title:</strong> ${proposal.jobTitle}
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Company:</strong> ${proposal.company}
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Proposed Amount:</strong> ${proposal.proposedAmount}
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Timeline:</strong> ${proposal.timeline || 'Not specified'}
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Status:</strong> 
                    <span class="status-badge status-${proposal.status.toLowerCase().replace(/\s+/g, '-')}">${proposal.status}</span>
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Sent Date:</strong> ${proposal.sentDate}
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <strong>Cover Letter:</strong><br>
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-top: 0.5rem; line-height: 1.6;">
                        ${proposal.coverLetter || proposal.description}
                    </div>
                </div>
                
                ${proposal.attachments && proposal.attachments.length > 0 ? `
                    <div style="margin-bottom: 1rem;">
                        <strong>Attachments:</strong><br>
                        ${proposal.attachments.map(att => `<span style="display: inline-block; background: #e9ecef; padding: 0.3rem 0.8rem; border-radius: 15px; margin: 0.2rem; font-size: 0.9rem;">${att}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    ${proposal.status === 'Awaiting Response' ? 
                        `<button onclick="window.proposalsManager.editProposal(${proposal.id}); this.closest('[style*=\"position: fixed\"]').remove();" class="apply-btn" style="background: #667eea;">Edit Proposal</button>` : 
                        ''
                    }
                    <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" class="apply-btn">Close</button>
                </div>
            </div>
        `;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        overlay.innerHTML = modalContent;
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        document.body.appendChild(overlay);
    }

    // Edit proposal
    editProposal(proposalId) {
        const proposal = this.proposals.find(p => p.id === proposalId);
        if (!proposal) {
            alert('Proposal not found.');
            return;
        }

        if (proposal.status !== 'Awaiting Response') {
            alert('You can only edit proposals that are awaiting response.');
            return;
        }

        const modalContent = `
            <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 700px; margin: 2rem auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-height: 80vh; overflow-y: auto;">
                <h2 style="color: #333; margin-bottom: 1rem;">Edit Proposal</h2>
                
                <form id="edit-proposal-form">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">Job Title</label>
                        <input type="text" value="${proposal.jobTitle}" readonly style="width: 100%; padding: 0.8rem; border: 2px solid #e9ecef; border-radius: 8px; background: #f8f9fa;">
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">Proposed Amount</label>
                        <input type="text" id="edit-amount" value="${proposal.proposedAmount}" class="form-input" required>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">Timeline</label>
                        <input type="text" id="edit-timeline" value="${proposal.timeline || ''}" class="form-input" placeholder="e.g., 2 weeks">
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">Cover Letter</label>
                        <textarea id="edit-cover-letter" class="form-textarea" rows="6" required>${proposal.coverLetter || proposal.description}</textarea>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" onclick="this.closest('[style*=\"position: fixed\"]').remove()" class="apply-btn" style="background: #6c757d;">Cancel</button>
                        <button type="submit" class="apply-btn">Update Proposal</button>
                    </div>
                </form>
            </div>
        `;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        overlay.innerHTML = modalContent;

        // Handle form submission
        overlay.querySelector('#edit-proposal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const updatedProposal = {
                ...proposal,
                proposedAmount: document.getElementById('edit-amount').value,
                timeline: document.getElementById('edit-timeline').value,
                coverLetter: document.getElementById('edit-cover-letter').value,
                description: `Proposed ${document.getElementById('edit-amount').value} • ${document.getElementById('edit-cover-letter').value.substring(0, 100)}...`
            };

            // Update in array and localStorage
            const index = this.proposals.findIndex(p => p.id === proposalId);
            this.proposals[index] = updatedProposal;
            localStorage.setItem('userProposals', JSON.stringify(this.proposals));

            alert('Proposal updated successfully!');
            overlay.remove();
            this.renderProposals();
        });

        document.body.appendChild(overlay);
    }

    // Add new proposal
    addProposal(proposalData) {
        const newProposal = {
            id: Date.now(),
            ...proposalData,
            status: 'Awaiting Response',
            sentDate: new Date().toLocaleDateString()
        };

        this.proposals.push(newProposal);
        localStorage.setItem('userProposals', JSON.stringify(this.proposals));
        
        // If currently viewing proposals, refresh
        if (window.navigationManager && window.navigationManager.getCurrentSection() === 'proposals') {
            this.renderProposals();
        }

        return newProposal;
    }

    // Update proposal status
    updateProposalStatus(proposalId, newStatus) {
        const proposal = this.proposals.find(p => p.id === proposalId);
        if (proposal) {
            proposal.status = newStatus;
            localStorage.setItem('userProposals', JSON.stringify(this.proposals));
            this.renderProposals();
        }
    }

    // Get proposals by status
    getProposalsByStatus(status) {
        return this.proposals.filter(proposal => proposal.status === status);
    }

    // Get proposal statistics
    getProposalStats() {
        const total = this.proposals.length;
        const awaiting = this.proposals.filter(p => p.status === 'Awaiting Response').length;
        const accepted = this.proposals.filter(p => p.status === 'Accepted').length;
        const rejected = this.proposals.filter(p => p.status === 'Rejected').length;

        return {
            total,
            awaiting,
            accepted,
            rejected,
            responseRate: total > 0 ? Math.round(((accepted + rejected) / total) * 100) : 0
        };
    }

    // Refresh proposals (for external calls)
    refreshProposals() {
        this.loadProposals();
    }
}

// Create global proposals manager instance
window.proposalsManager = new ProposalsManager();