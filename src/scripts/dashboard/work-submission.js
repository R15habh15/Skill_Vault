// Work Submission Management for Freelancers and Companies

class WorkSubmissionManager {
    constructor() {
        this.userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (this.userInfo) {
            this.init();
        }
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // File upload preview
        const fileInput = document.getElementById('work-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const preview = document.getElementById('file-preview');
        if (preview) {
            const fileSize = (file.size / (1024 * 1024)).toFixed(2);
            preview.innerHTML = `
                <div style="padding: 1rem; background: #f8f9fa; border-radius: 8px; margin-top: 1rem;">
                    <i class="fas fa-file" style="color: #667eea; font-size: 2rem;"></i>
                    <p style="margin: 0.5rem 0;"><strong>${file.name}</strong></p>
                    <p style="margin: 0; color: #666; font-size: 0.9rem;">Size: ${fileSize} MB</p>
                </div>
            `;
        }
    }

    async submitWork(projectId) {
        const fileInput = document.getElementById('work-file-input');
        const notes = document.getElementById('work-notes')?.value || '';

        if (!fileInput || !fileInput.files[0]) {
            alert('Please select a file to upload');
            return;
        }

        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('workFile', file);
        formData.append('projectId', projectId);
        formData.append('freelancerId', this.userInfo.id);
        formData.append('notes', notes);

        try {
            const response = await fetch('/api/work-submission/submit', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                alert('Work submitted successfully! The company will review it.');
                this.closeSubmitModal();
                if (window.activeProjectsManager) {
                    window.activeProjectsManager.loadActiveProjects();
                }
            } else {
                alert('Failed to submit work: ' + data.message);
            }
        } catch (err) {
            console.error('Error submitting work:', err);
            alert('Failed to submit work');
        }
    }

    showSubmitWorkModal(projectId, projectTitle) {
        const modal = document.createElement('div');
        modal.id = 'submit-work-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2><i class="fas fa-upload"></i> Submit Work</h2>
                    <button class="close-btn" onclick="workSubmissionManager.closeSubmitModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <h3 style="margin-bottom: 1rem; color: #333;">${projectTitle}</h3>
                    
                    <div class="form-group">
                        <label for="work-file-input">Upload Work File *</label>
                        <input type="file" id="work-file-input" class="form-input" accept=".pdf,.doc,.docx,.zip,.rar,.jpg,.jpeg,.png,.psd,.ai,.fig" required>
                        <small style="color: #666;">Accepted formats: PDF, DOC, DOCX, ZIP, RAR, Images, PSD, AI, FIG (Max 50MB)</small>
                        <div id="file-preview"></div>
                    </div>

                    <div class="form-group">
                        <label for="work-notes">Notes (Optional)</label>
                        <textarea id="work-notes" class="form-textarea" rows="4" placeholder="Add any notes or comments about your submission..."></textarea>
                    </div>

                    <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                        <p style="margin: 0; color: #856404; font-size: 0.9rem;">
                            <i class="fas fa-info-circle"></i> Once submitted, the company will review your work. They can either approve it or request revisions.
                        </p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn" onclick="workSubmissionManager.closeSubmitModal()">Cancel</button>
                    <button class="submit-btn" onclick="workSubmissionManager.submitWork(${projectId})">
                        <i class="fas fa-upload"></i> Submit Work
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
        this.setupEventListeners();
    }

    closeSubmitModal() {
        const modal = document.getElementById('submit-work-modal');
        if (modal) {
            modal.remove();
        }
    }

    async viewSubmissions(projectId) {
        try {
            const response = await fetch(`/api/work-submission/project/${projectId}`);
            const data = await response.json();

            if (data.success) {
                this.showSubmissionsModal(projectId, data.submissions);
            }
        } catch (err) {
            console.error('Error fetching submissions:', err);
            alert('Failed to load submissions');
        }
    }

    showSubmissionsModal(projectId, submissions) {
        const isCompany = this.userInfo.user_type === 'company';

        const modal = document.createElement('div');
        modal.id = 'submissions-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2><i class="fas fa-file-alt"></i> Work Submissions</h2>
                    <button class="close-btn" onclick="workSubmissionManager.closeSubmissionsModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${submissions.length === 0 ? `
                        <div style="text-align: center; padding: 2rem; color: #666;">
                            <i class="fas fa-inbox" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                            <p>No submissions yet</p>
                        </div>
                    ` : submissions.map(sub => `
                        <div class="submission-card" style="background: white; padding: 1.5rem; border-radius: 10px; border: 2px solid ${this.getSubmissionStatusColor(sub.status)}; margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                <div>
                                    <h3 style="margin-bottom: 0.5rem;">Submission #${sub.submission_number}</h3>
                                    <p style="color: #666; font-size: 0.9rem; margin: 0;">
                                        <i class="fas fa-calendar"></i> ${new Date(sub.submitted_at).toLocaleString()}
                                    </p>
                                </div>
                                <span class="badge" style="background: ${this.getSubmissionStatusColor(sub.status)}; color: white; padding: 0.5rem 1rem; border-radius: 20px;">
                                    ${this.formatStatus(sub.status)}
                                </span>
                            </div>

                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                                <p style="margin: 0; color: #333;">
                                    <i class="fas fa-file"></i> <strong>${sub.file_name}</strong>
                                </p>
                                <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.9rem;">
                                    Size: ${(sub.file_size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                            </div>

                            ${sub.notes ? `
                                <div style="margin-bottom: 1rem;">
                                    <strong>Notes:</strong>
                                    <p style="color: #666; margin: 0.5rem 0 0 0;">${sub.notes}</p>
                                </div>
                            ` : ''}

                            ${sub.revision_notes ? `
                                <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                                    <strong style="color: #856404;"><i class="fas fa-exclamation-triangle"></i> Revision Requested:</strong>
                                    <p style="color: #856404; margin: 0.5rem 0 0 0;">${sub.revision_notes}</p>
                                </div>
                            ` : ''}

                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                ${isCompany ? `
                                    <button onclick="workSubmissionManager.viewFile(${sub.id})" class="apply-btn" style="background: #17a2b8; font-size: 0.9rem;">
                                        <i class="fas fa-eye"></i> View File
                                    </button>
                                    ${sub.status === 'pending' || sub.status === 'under_review' ? `
                                        <button onclick="workSubmissionManager.showReviewModal(${sub.id}, ${projectId}, 'approved')" class="apply-btn" style="background: #28a745; font-size: 0.9rem;">
                                            <i class="fas fa-check"></i> Approve Work
                                        </button>
                                        <button onclick="workSubmissionManager.showReviewModal(${sub.id}, ${projectId}, 'needs_revision')" class="apply-btn" style="background: #ffc107; font-size: 0.9rem;">
                                            <i class="fas fa-edit"></i> Request Revision
                                        </button>
                                    ` : ''}
                                    ${sub.status === 'approved' ? `
                                        <button onclick="workSubmissionManager.downloadFile(${sub.id})" class="apply-btn" style="background: #667eea; font-size: 0.9rem;">
                                            <i class="fas fa-download"></i> Download File
                                        </button>
                                    ` : ''}
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn" onclick="workSubmissionManager.closeSubmissionsModal()">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    closeSubmissionsModal() {
        const modal = document.getElementById('submissions-modal');
        if (modal) {
            modal.remove();
        }
    }

    getSubmissionStatusColor(status) {
        const colors = {
            pending: '#ffc107',
            under_review: '#17a2b8',
            approved: '#28a745',
            needs_revision: '#dc3545'
        };
        return colors[status] || '#6c757d';
    }

    formatStatus(status) {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    viewFile(submissionId) {
        window.open(`/api/work-submission/view/${submissionId}?userId=${this.userInfo.id}`, '_blank');
    }

    downloadFile(submissionId) {
        window.location.href = `/api/work-submission/download/${submissionId}?userId=${this.userInfo.id}`;
    }

    showReviewModal(submissionId, projectId, reviewType) {
        const isApproval = reviewType === 'approved';

        const modal = document.createElement('div');
        modal.id = 'review-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2><i class="fas fa-${isApproval ? 'check-circle' : 'edit'}"></i> ${isApproval ? 'Approve Work' : 'Request Revision'}</h2>
                    <button class="close-btn" onclick="workSubmissionManager.closeReviewModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${isApproval ? `
                        <div style="background: #d4edda; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <p style="margin: 0; color: #155724;">
                                <i class="fas fa-info-circle"></i> <strong>Approving this work will:</strong>
                            </p>
                            <ul style="margin: 0.5rem 0 0 1.5rem; color: #155724;">
                                <li>Release the escrowed payment to the freelancer</li>
                                <li>Move the project to Past Projects</li>
                                <li>Allow you to download the final files</li>
                            </ul>
                        </div>
                        <p style="color: #333;">Are you sure you want to approve this work?</p>
                    ` : `
                        <div class="form-group">
                            <label for="revision-notes">Revision Notes *</label>
                            <textarea id="revision-notes" class="form-textarea" rows="6" placeholder="Describe what changes are needed..." required></textarea>
                        </div>
                        <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                            <p style="margin: 0; color: #856404; font-size: 0.9rem;">
                                <i class="fas fa-info-circle"></i> The freelancer will be notified and can resubmit the work with your requested changes.
                            </p>
                        </div>
                    `}
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn" onclick="workSubmissionManager.closeReviewModal()">Cancel</button>
                    <button class="submit-btn" style="background: ${isApproval ? '#28a745' : '#ffc107'};" onclick="workSubmissionManager.submitReview(${submissionId}, ${projectId}, '${reviewType}')">
                        <i class="fas fa-${isApproval ? 'check' : 'paper-plane'}"></i> ${isApproval ? 'Approve & Release Payment' : 'Send Revision Request'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    closeReviewModal() {
        const modal = document.getElementById('review-modal');
        if (modal) {
            modal.remove();
        }
    }

    async submitReview(submissionId, projectId, reviewType) {
        let revisionNotes = '';

        if (reviewType === 'needs_revision') {
            revisionNotes = document.getElementById('revision-notes')?.value || '';
            if (!revisionNotes.trim()) {
                alert('Please provide revision notes');
                return;
            }
        }

        try {
            const response = await fetch('/api/work-submission/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submissionId,
                    projectId,
                    companyId: this.userInfo.id,
                    reviewType,
                    revisionNotes
                })
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);
                this.closeReviewModal();
                this.closeSubmissionsModal();
                if (window.activeProjectsManager) {
                    window.activeProjectsManager.loadActiveProjects();
                }
            } else {
                alert('Failed to submit review: ' + data.message);
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            alert('Failed to submit review');
        }
    }

    async loadPastProjects(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const response = await fetch(`/api/work-submission/past-projects/${this.userInfo.id}?userType=${this.userInfo.user_type}`);
            const data = await response.json();

            if (data.success) {
                this.displayPastProjects(data.projects, container);
            }
        } catch (err) {
            console.error('Error loading past projects:', err);
            container.innerHTML = '<p style="text-align: center; color: #666;">Failed to load past projects</p>';
        }
    }

    displayPastProjects(projects, container) {
        if (projects.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-history" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No completed projects yet</p>
                </div>
            `;
            return;
        }

        const isCompany = this.userInfo.user_type === 'company';

        container.innerHTML = projects.map(project => `
            <div class="project-card" style="background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <h3 style="margin-bottom: 0.5rem; color: #333;">${project.title}</h3>
                        <p style="color: #667eea; font-size: 0.9rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-${isCompany ? 'user' : 'building'}"></i> 
                            ${project.other_party_name}
                        </p>
                    </div>
                    <span class="badge" style="background: #28a745; color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem;">
                        <i class="fas fa-check-circle"></i> Completed
                    </span>
                </div>

                ${project.description ? `
                    <p style="color: #666; margin-bottom: 1rem; line-height: 1.6;">
                        ${project.description.substring(0, 150)}${project.description.length > 150 ? '...' : ''}
                    </p>
                ` : ''}

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <div>
                        <div style="font-size: 0.85rem; color: #666;">${isCompany ? 'Paid' : 'Earned'}</div>
                        <div style="font-size: 1.1rem; font-weight: bold; color: #28a745;">${project.final_amount} VCreds</div>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; color: #666;">Submissions</div>
                        <div style="font-size: 1rem; font-weight: 600;">${project.submission_count}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; color: #666;">Revisions</div>
                        <div style="font-size: 1rem; font-weight: 600;">${project.revision_count}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 0.5rem; font-size: 0.85rem; color: #666; margin-bottom: 1rem;">
                    <span><i class="fas fa-calendar-check"></i> Completed: ${new Date(project.completed_at).toLocaleDateString()}</span>
                </div>

                ${isCompany && project.final_file_url ? `
                    <button onclick="window.location.href='/api/work-submission/download/${project.id}?userId=${this.userInfo.id}'" class="apply-btn" style="background: #667eea; font-size: 0.9rem;">
                        <i class="fas fa-download"></i> Download Final Files
                    </button>
                ` : ''}
            </div>
        `).join('');
    }
}

// Initialize when DOM is ready
let workSubmissionManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        workSubmissionManager = new WorkSubmissionManager();
        window.workSubmissionManager = workSubmissionManager;
    });
} else {
    workSubmissionManager = new WorkSubmissionManager();
    window.workSubmissionManager = workSubmissionManager;
}
