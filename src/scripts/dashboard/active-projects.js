// Active Projects Management
class ActiveProjectsManager {
    constructor() {
        this.activeProjects = [];
        this.init();
    }

    init() {
        this.loadActiveProjects();
    }

    // Load active projects
    loadActiveProjects() {
        this.activeProjects = JSON.parse(localStorage.getItem('userActiveProjects') || '[]');
        this.renderActiveProjects();
    }

    // Render active projects to the container
    renderActiveProjects() {
        const container = document.getElementById('active-projects-container');
        if (!container) return;

        if (this.activeProjects.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-tasks" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <h3>No Active Projects</h3>
                    <p>Your active projects will appear here once you start working!</p>
                    <button class="apply-btn" onclick="window.navigationManager.showSection('jobs')" style="margin-top: 1rem;">
                        <i class="fas fa-search"></i> Find Projects
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.activeProjects.map(project => `
            <div class="job-card">
                <div class="job-header">
                    <div>
                        <div class="job-title">${project.title}</div>
                        <div class="job-company">${project.company}</div>
                    </div>
                    <div style="background: ${this.getProgressColor(project.progress)}; color: white; padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.8rem;">
                        ${project.progress}% Complete
                    </div>
                </div>
                <div class="job-description">${project.description}</div>
                
                <!-- Progress Bar -->
                <div style="margin: 1rem 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.9rem; color: #666;">Project Progress</span>
                        <span style="font-size: 0.9rem; font-weight: bold; color: ${this.getProgressColor(project.progress)};">${project.progress}%</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: rgba(102, 126, 234, 0.1); border-radius: 10px; overflow: hidden;">
                        <div style="width: ${project.progress}%; height: 100%; background: linear-gradient(90deg, ${this.getProgressColor(project.progress)}, ${this.getProgressColor(project.progress, 0.8)}); transition: width 0.3s ease;"></div>
                    </div>
                </div>

                <!-- Milestones -->
                ${project.milestones ? `
                    <div style="background: rgba(102, 126, 234, 0.05); padding: 1rem; border-radius: 10px; margin: 1rem 0;">
                        <h4 style="color: #333; margin-bottom: 0.75rem; font-size: 0.95rem;">Milestones</h4>
                        <div style="display: grid; gap: 0.5rem;">
                            ${project.milestones.map(milestone => `
                                <label style="display: flex; align-items: center; gap: 0.5rem;">
                                    <input type="checkbox" ${milestone.completed ? 'checked' : ''} disabled style="width: 18px; height: 18px;">
                                    <span style="color: ${milestone.completed ? '#666' : '#333'}; ${milestone.completed ? 'text-decoration: line-through;' : milestone.inProgress ? 'font-weight: 500;' : ''}">${milestone.name}${milestone.inProgress ? ' (In Progress)' : ''}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Project Stats -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin: 1rem 0;">
                    <div style="background: white; padding: 0.75rem; border-radius: 8px; text-align: center; border: 1px solid rgba(102, 126, 234, 0.1);">
                        <div style="color: #667eea; font-weight: bold; font-size: 1.2rem;">${project.contractValue}</div>
                        <div style="color: #999; font-size: 0.8rem;">Contract Value</div>
                    </div>
                    <div style="background: white; padding: 0.75rem; border-radius: 8px; text-align: center; border: 1px solid rgba(102, 126, 234, 0.1);">
                        <div style="color: #28a745; font-weight: bold; font-size: 1.2rem;">${project.earned}</div>
                        <div style="color: #999; font-size: 0.8rem;">Earned</div>
                    </div>
                    <div style="background: white; padding: 0.75rem; border-radius: 8px; text-align: center; border: 1px solid rgba(102, 126, 234, 0.1);">
                        <div style="color: #ff6b6b; font-weight: bold; font-size: 1.2rem;">${project.timeLeft}</div>
                        <div style="color: #999; font-size: 0.8rem;">Time Left</div>
                    </div>
                </div>

                <div class="job-meta">
                    <span class="job-date"><i class="fas fa-calendar"></i> Deadline: ${project.deadline}</span>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="apply-btn" style="background: #667eea;" onclick="window.activeProjectsManager.continueWork(${project.id})">
                            <i class="fas fa-code"></i> Continue Work
                        </button>
                        <button class="apply-btn" style="background: #764ba2;" onclick="window.activeProjectsManager.messageClient(${project.id})">
                            <i class="fas fa-comments"></i> Message Client
                        </button>
                        <button class="apply-btn" style="background: #28a745;" onclick="window.activeProjectsManager.updateProgress(${project.id})">
                            <i class="fas fa-chart-line"></i> Update Progress
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Get progress color based on percentage
    getProgressColor(progress, opacity = 1) {
        if (progress >= 80) return `rgba(40, 167, 69, ${opacity})`;
        if (progress >= 50) return `rgba(255, 193, 7, ${opacity})`;
        if (progress >= 25) return `rgba(102, 126, 234, ${opacity})`;
        return `rgba(255, 107, 107, ${opacity})`;
    }

    // Continue work on project
    continueWork(projectId) {
        const project = this.activeProjects.find(p => p.id === projectId);
        if (!project) {
            alert('Project not found.');
            return;
        }

        alert(`Opening workspace for "${project.title}"...`);
        // In a real app, this would open the project workspace or development environment
    }

    // Message client
    messageClient(projectId) {
        const project = this.activeProjects.find(p => p.id === projectId);
        if (!project) {
            alert('Project not found.');
            return;
        }

        alert(`Opening chat with ${project.company}...`);
        // In a real app, this would open the messaging interface
    }

    // Update project progress
    updateProgress(projectId) {
        const project = this.activeProjects.find(p => p.id === projectId);
        if (!project) {
            alert('Project not found.');
            return;
        }

        const modalContent = `
            <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 600px; margin: 2rem auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <h2 style="color: #333; margin-bottom: 1rem;">Update Project Progress</h2>
                
                <form id="progress-form">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">Project: ${project.title}</label>
                        <div style="color: #666;">${project.company}</div>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">Progress Percentage</label>
                        <input type="range" id="progress-slider" min="0" max="100" value="${project.progress}" 
                               style="width: 100%; margin-bottom: 0.5rem;"
                               oninput="document.getElementById('progress-value').textContent = this.value + '%'">
                        <div style="text-align: center; font-weight: bold; color: #667eea;" id="progress-value">${project.progress}%</div>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">Progress Update</label>
                        <textarea id="progress-notes" class="form-textarea" rows="4" placeholder="Describe what you've completed..."></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" onclick="this.closest('[style*=\"position: fixed\"]').remove()" class="apply-btn" style="background: #6c757d;">Cancel</button>
                        <button type="submit" class="apply-btn">Update Progress</button>
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
        overlay.querySelector('#progress-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const newProgress = parseInt(document.getElementById('progress-slider').value);
            const notes = document.getElementById('progress-notes').value;

            // Update project progress
            project.progress = newProgress;
            
            // Update milestones based on progress
            if (project.milestones) {
                const milestonesCount = project.milestones.length;
                const completedCount = Math.floor((newProgress / 100) * milestonesCount);
                
                project.milestones.forEach((milestone, index) => {
                    if (index < completedCount) {
                        milestone.completed = true;
                        milestone.inProgress = false;
                    } else if (index === completedCount) {
                        milestone.completed = false;
                        milestone.inProgress = true;
                    } else {
                        milestone.completed = false;
                        milestone.inProgress = false;
                    }
                });
            }

            // Save to localStorage
            localStorage.setItem('userActiveProjects', JSON.stringify(this.activeProjects));

            alert('Progress updated successfully!');
            overlay.remove();
            this.renderActiveProjects();
        });

        document.body.appendChild(overlay);
    }

    // Add new active project
    addActiveProject(projectData) {
        const newProject = {
            id: Date.now(),
            ...projectData,
            progress: projectData.progress || 0,
            startDate: new Date().toLocaleDateString()
        };

        this.activeProjects.push(newProject);
        localStorage.setItem('userActiveProjects', JSON.stringify(this.activeProjects));
        
        // If currently viewing active projects, refresh
        if (window.navigationManager && window.navigationManager.getCurrentSection() === 'projects') {
            this.renderActiveProjects();
        }

        return newProject;
    }

    // Complete project (move to past projects)
    completeProject(projectId) {
        const projectIndex = this.activeProjects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) {
            alert('Project not found.');
            return;
        }

        const project = this.activeProjects[projectIndex];
        
        // Move to past projects
        const pastProjects = JSON.parse(localStorage.getItem('userPastProjects') || '[]');
        const completedProject = {
            ...project,
            progress: 100,
            completedDate: new Date().toLocaleDateString(),
            rating: 5, // Default rating, could be set by client
            status: 'Completed'
        };
        
        pastProjects.push(completedProject);
        localStorage.setItem('userPastProjects', JSON.stringify(pastProjects));

        // Remove from active projects
        this.activeProjects.splice(projectIndex, 1);
        localStorage.setItem('userActiveProjects', JSON.stringify(this.activeProjects));

        alert('Project marked as completed!');
        this.renderActiveProjects();
    }

    // Get project statistics
    getProjectStats() {
        const total = this.activeProjects.length;
        const onTrack = this.activeProjects.filter(p => p.progress >= 50).length;
        const delayed = this.activeProjects.filter(p => {
            // Simple logic: if less than 25% progress and deadline is soon
            return p.progress < 25;
        }).length;

        return {
            total,
            onTrack,
            delayed,
            averageProgress: total > 0 ? Math.round(this.activeProjects.reduce((sum, p) => sum + p.progress, 0) / total) : 0
        };
    }

    // Refresh active projects (for external calls)
    refreshProjects() {
        this.loadActiveProjects();
    }
}

// Create global active projects manager instance
window.activeProjectsManager = new ActiveProjectsManager();