// Past Projects Management
class PastProjectsManager {
    constructor() {
        this.pastProjects = [];
        this.filteredProjects = [];
        this.currentFilter = 'All Projects';
        this.currentSearch = '';
        this.init();
    }

    init() {
        this.loadPastProjects();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('#past-projects .search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentSearch = e.target.value.toLowerCase();
                this.filterProjects();
            });
        }

        // Filter functionality
        const filterSelect = document.querySelector('#past-projects .filter-select');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.filterProjects();
            });
        }
    }

    // Load past projects
    loadPastProjects() {
        this.pastProjects = JSON.parse(localStorage.getItem('userPastProjects') || '[]');
        
        // Keep past projects empty for new users
        // Projects will be added when users actually complete work
        this.filteredProjects = [...this.pastProjects];
        this.renderPastProjects();
    }

    // Filter projects based on search and category
    filterProjects() {
        this.filteredProjects = this.pastProjects.filter(project => {
            const matchesSearch = this.currentSearch === '' || 
                project.title.toLowerCase().includes(this.currentSearch) ||
                project.company.toLowerCase().includes(this.currentSearch) ||
                project.description.toLowerCase().includes(this.currentSearch) ||
                project.skills.some(skill => skill.toLowerCase().includes(this.currentSearch));

            const matchesCategory = this.currentFilter === 'All Projects' || 
                project.category === this.currentFilter;

            return matchesSearch && matchesCategory;
        });

        this.renderPastProjects();
    }

    // Render past projects to the container
    renderPastProjects() {
        const container = document.getElementById('past-projects-container');
        if (!container) return;

        if (this.filteredProjects.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-briefcase" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <h3>No Projects in Portfolio</h3>
                    <p>${this.pastProjects.length === 0 ? 'Complete your first project to start building your portfolio! Your finished work will be showcased here to attract more clients.' : 'Try adjusting your search criteria.'}</p>
                    ${this.currentSearch || this.currentFilter !== 'All Projects' ? 
                        '<button class="apply-btn" onclick="window.pastProjectsManager.clearFilters()" style="margin-top: 1rem;">Clear Filters</button>' : 
                        '<button class="apply-btn" onclick="window.navigationManager.showSection(\'jobs\')" style="margin-top: 1rem;"><i class="fas fa-search"></i> Browse Jobs</button>'
                    }
                </div>
            `;
            return;
        }

        // Calculate portfolio stats
        const totalProjects = this.pastProjects.length;
        const happyClients = totalProjects > 0 ? Math.floor(totalProjects * 0.8) : 0;
        const avgRating = totalProjects > 0 ? (this.pastProjects.reduce((sum, p) => sum + p.rating, 0) / totalProjects).toFixed(1) : 0;
        const onTimeDelivery = totalProjects > 0 ? '98%' : '0%';

        container.innerHTML = `
            <div class="stats-grid" style="margin-bottom: 2rem;">
                <div class="stat-card">
                    <div class="icon"><i class="fas fa-check-circle"></i></div>
                    <div class="number">${totalProjects}</div>
                    <div class="label">Completed Projects</div>
                </div>
                <div class="stat-card">
                    <div class="icon"><i class="fas fa-users"></i></div>
                    <div class="number">${happyClients}</div>
                    <div class="label">Happy Clients</div>
                </div>
                <div class="stat-card">
                    <div class="icon"><i class="fas fa-star"></i></div>
                    <div class="number">${avgRating}</div>
                    <div class="label">Average Rating</div>
                </div>
                <div class="stat-card">
                    <div class="icon"><i class="fas fa-clock"></i></div>
                    <div class="number">${onTimeDelivery}</div>
                    <div class="label">On-time Delivery</div>
                </div>
            </div>
            <div style="display: grid; gap: 2rem;">
                ${this.filteredProjects.map(project => `
                    <div style="background: rgba(255, 255, 255, 0.95); border: 2px solid rgba(102, 126, 234, 0.1); border-radius: 20px; padding: 2rem; transition: all 0.3s ease; cursor: pointer;"
                        onmouseover="this.style.borderColor='#667eea'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 15px 35px rgba(102, 126, 234, 0.2)'"
                        onmouseout="this.style.borderColor='rgba(102, 126, 234, 0.1)'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; align-items: center;">
                            <div style="background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 15px; height: 200px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; position: relative; overflow: hidden;">
                                <div style="position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.2); padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.8rem; backdrop-filter: blur(10px);">
                                    <i class="fas fa-${project.type === 'web' ? 'laptop-code' : project.type === 'mobile' ? 'mobile-alt' : 'paint-brush'}"></i> ${project.category}
                                </div>
                                <i class="fas fa-${project.icon}" style="font-size: 4rem; opacity: 0.3;"></i>
                            </div>
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                    <div>
                                        <h3 style="font-size: 1.5rem; color: #333; margin-bottom: 0.5rem;">${project.title}</h3>
                                        <p style="color: #667eea; font-weight: 500; margin-bottom: 1rem;">${project.company}</p>
                                    </div>
                                    <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-weight: bold;">
                                        $${project.earnings}
                                    </div>
                                </div>
                                <p style="color: #666; line-height: 1.6; margin-bottom: 1rem;">${project.description}</p>
                                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
                                    ${project.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="display: flex; gap: 1rem; align-items: center;">
                                        <div style="display: flex; align-items: center; gap: 0.3rem;">
                                            <span style="color: #ffc107;">${'★'.repeat(project.rating)}${'☆'.repeat(5 - project.rating)}</span>
                                            <span style="color: #666; font-size: 0.9rem;">(${project.rating}.0)</span>
                                        </div>
                                        <span style="color: #999; font-size: 0.9rem;">Completed: ${project.completedDate}</span>
                                    </div>
                                    <div style="display: flex; gap: 0.5rem;">
                                        ${project.liveUrl ? `<button onclick="window.open('${project.liveUrl}', '_blank')" style="background: rgba(102, 126, 234, 0.1); color: #667eea; border: none; padding: 0.4rem 0.8rem; border-radius: 15px; cursor: pointer; font-size: 0.9rem;"><i class="fas fa-external-link-alt"></i> Live Demo</button>` : ''}
                                        ${project.codeUrl ? `<button onclick="window.open('${project.codeUrl}', '_blank')" style="background: rgba(102, 126, 234, 0.1); color: #667eea; border: none; padding: 0.4rem 0.8rem; border-radius: 15px; cursor: pointer; font-size: 0.9rem;"><i class="fas fa-code"></i> View Code</button>` : ''}
                                        <button onclick="window.pastProjectsManager.viewProjectDetails(${project.id})" style="background: rgba(102, 126, 234, 0.1); color: #667eea; border: none; padding: 0.4rem 0.8rem; border-radius: 15px; cursor: pointer; font-size: 0.9rem;"><i class="fas fa-eye"></i> Details</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ${project.feedback ? `
                            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(0,0,0,0.1);">
                                <h4 style="color: #333; margin-bottom: 0.5rem;">Client Feedback:</h4>
                                <p style="color: #666; font-style: italic; line-height: 1.6;">"${project.feedback}"</p>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    // View project details
    viewProjectDetails(projectId) {
        const project = this.pastProjects.find(p => p.id === projectId);
        if (!project) {
            alert('Project not found.');
            return;
        }

        const modalContent = `
            <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 800px; margin: 2rem auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-height: 80vh; overflow-y: auto;">
                <h2 style="color: #333; margin-bottom: 1rem;">${project.title}</h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                    <div>
                        <h4 style="color: #333; margin-bottom: 0.5rem;">Project Information</h4>
                        <div style="margin-bottom: 0.5rem;"><strong>Client:</strong> ${project.company}</div>
                        <div style="margin-bottom: 0.5rem;"><strong>Category:</strong> ${project.category}</div>
                        <div style="margin-bottom: 0.5rem;"><strong>Completed:</strong> ${project.completedDate}</div>
                        <div style="margin-bottom: 0.5rem;"><strong>Rating:</strong> ${'★'.repeat(project.rating)}${'☆'.repeat(5 - project.rating)} (${project.rating}/5)</div>
                    </div>
                    <div>
                        <h4 style="color: #333; margin-bottom: 0.5rem;">Financial Details</h4>
                        <div style="margin-bottom: 0.5rem;"><strong>Contract Value:</strong> ${project.contractValue}</div>
                        <div style="margin-bottom: 0.5rem;"><strong>Earnings:</strong> $${project.earnings}</div>
                        <div style="margin-bottom: 0.5rem;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Completed</span></div>
                    </div>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: #333; margin-bottom: 0.5rem;">Project Description</h4>
                    <p style="color: #666; line-height: 1.6;">${project.description}</p>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: #333; margin-bottom: 0.5rem;">Technologies Used</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${project.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
                
                ${project.feedback ? `
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: #333; margin-bottom: 0.5rem;">Client Feedback</h4>
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border-left: 4px solid #667eea;">
                            <p style="color: #666; font-style: italic; line-height: 1.6; margin: 0;">"${project.feedback}"</p>
                        </div>
                    </div>
                ` : ''}
                
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    ${project.liveUrl ? `<button onclick="window.open('${project.liveUrl}', '_blank')" class="apply-btn" style="background: #28a745;"><i class="fas fa-external-link-alt"></i> Live Demo</button>` : ''}
                    ${project.codeUrl ? `<button onclick="window.open('${project.codeUrl}', '_blank')" class="apply-btn" style="background: #667eea;"><i class="fas fa-code"></i> View Code</button>` : ''}
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

    // Clear all filters
    clearFilters() {
        this.currentSearch = '';
        this.currentFilter = 'All Projects';
        
        // Reset UI elements
        const searchInput = document.querySelector('#past-projects .search-input');
        const filterSelect = document.querySelector('#past-projects .filter-select');
        
        if (searchInput) searchInput.value = '';
        if (filterSelect) filterSelect.value = 'All Projects';
        
        this.filterProjects();
    }

    // Add completed project
    addCompletedProject(projectData) {
        const completedProject = {
            id: Date.now(),
            ...projectData,
            completedDate: new Date().toLocaleDateString(),
            rating: projectData.rating || 5
        };

        this.pastProjects.push(completedProject);
        localStorage.setItem('userPastProjects', JSON.stringify(this.pastProjects));
        
        // If currently viewing past projects, refresh
        if (window.navigationManager && window.navigationManager.getCurrentSection() === 'past-projects') {
            this.loadPastProjects();
        }

        return completedProject;
    }

    // Get portfolio statistics
    getPortfolioStats() {
        const totalProjects = this.pastProjects.length;
        const totalEarnings = this.pastProjects.reduce((sum, p) => sum + parseFloat(p.earnings.replace(/,/g, '')), 0);
        const avgRating = totalProjects > 0 ? (this.pastProjects.reduce((sum, p) => sum + p.rating, 0) / totalProjects).toFixed(1) : 0;
        const categories = [...new Set(this.pastProjects.map(p => p.category))];

        return {
            totalProjects,
            totalEarnings,
            avgRating,
            categories,
            happyClients: Math.floor(totalProjects * 0.8)
        };
    }

    // Refresh past projects (for external calls)
    refreshProjects() {
        this.loadPastProjects();
    }
}

// Create global past projects manager instance
window.pastProjectsManager = new PastProjectsManager();