// Job browsing functionality
document.addEventListener('DOMContentLoaded', function() {
    loadJobs();
    initializeEventListeners();
    initializeScrollEffects();
});

// Initialize event listeners
function initializeEventListeners() {
    document.getElementById('search-btn').addEventListener('click', loadJobs);
    
    document.getElementById('search').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            loadJobs();
        }
    });
    
    document.getElementById('filter-category').addEventListener('change', loadJobs);
    document.getElementById('filter-duration').addEventListener('change', loadJobs);
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
}

// Navbar scroll effects
function initializeScrollEffects() {
    window.addEventListener('scroll', function() {
        const navbar = document.getElementById('navbar');
        if (navbar && window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else if (navbar) {
            navbar.classList.remove('scrolled');
        }
    });
}

// Load jobs from localStorage or create sample data
function loadJobs() {
    const jobList = document.getElementById('job-list');
    const emptyState = document.getElementById('empty-state');
    
    // Get filters
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const categoryFilter = document.getElementById('filter-category').value;
    const durationFilter = document.getElementById('filter-duration').value;
    
    // Get jobs from localStorage or use sample data
    let jobs = getJobsData();
    
    // Filter jobs
    const filteredJobs = jobs.filter(job => {
        const matchesSearch = !searchTerm || 
            job.job_title.toLowerCase().includes(searchTerm) || 
            job.job_description.toLowerCase().includes(searchTerm) ||
            job.company_name.toLowerCase().includes(searchTerm) ||
            (job.requirements && job.requirements.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !categoryFilter || job.category === categoryFilter;
        const matchesDuration = !durationFilter || job.project_duration === durationFilter;
        
        return matchesSearch && matchesCategory && matchesDuration;
    });
    
    // Clear job list
    jobList.innerHTML = '';
    
    // Show empty state if no jobs
    if (filteredJobs.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    // Hide empty state
    emptyState.style.display = 'none';
    
    // Display jobs with animation
    filteredJobs.forEach((job, index) => {
        setTimeout(() => {
            const jobCard = createJobCard(job);
            jobCard.style.opacity = '0';
            jobCard.style.transform = 'translateY(20px)';
            jobList.appendChild(jobCard);
            
            // Animate in
            setTimeout(() => {
                jobCard.style.transition = 'all 0.5s ease';
                jobCard.style.opacity = '1';
                jobCard.style.transform = 'translateY(0)';
            }, 50);
        }, index * 100);
    });
}

// Get jobs data from localStorage or return sample data
function getJobsData() {
    try {
        const storedJobs = localStorage.getItem('jobs');
        if (storedJobs) {
            return JSON.parse(storedJobs);
        }
    } catch (e) {
        console.error('Error loading jobs from localStorage:', e);
    }
    
    // Return sample data if no jobs in localStorage
    return getSampleJobs();
}

// Sample jobs data
function getSampleJobs() {
    return [
        {
            id: 1,
            job_title: "Modern E-commerce Website Development",
            company_name: "TechStart Solutions",
            company_email: "jobs@techstart.com",
            category: "web-development",
            project_duration: "1-3-months",
            budget: 5000,
            job_description: "We need a skilled developer to create a modern, responsive e-commerce website with payment integration, inventory management, and user authentication. The site should be built using React.js and Node.js with a clean, professional design.",
            requirements: "Requirements:\n• 3+ years React.js experience\n• Node.js and Express.js proficiency\n• Payment gateway integration experience\n• Responsive design skills\n• Database design (MongoDB/PostgreSQL)\n• Git version control",
            date_posted: "2 days ago"
        },
        {
            id: 2,
            job_title: "Mobile App UI/UX Design",
            company_name: "Innovation Labs",
            company_email: "design@innovationlabs.com",
            category: "design",
            project_duration: "1-4-weeks",
            budget: 2500,
            job_description: "Looking for a creative UI/UX designer to design a mobile app interface for our fitness tracking application. The design should be modern, intuitive, and follow Material Design guidelines.",
            requirements: "Requirements:\n• Figma or Adobe XD expertise\n• Mobile app design experience\n• Material Design knowledge\n• User research skills\n• Prototyping abilities\n• Portfolio of mobile designs",
            date_posted: "1 day ago"
        },
        {
            id: 3,
            job_title: "Content Marketing Strategy & Blog Writing",
            company_name: "Digital Growth Co.",
            company_email: "content@digitalgrowth.com",
            category: "writing",
            project_duration: "3-6-months",
            budget: 3000,
            job_description: "We're seeking a content marketing specialist to develop our content strategy and write high-quality blog posts for our SaaS platform. The role includes keyword research, content planning, and SEO optimization.",
            requirements: "Requirements:\n• Content marketing experience\n• SEO knowledge\n• SaaS industry familiarity\n• WordPress proficiency\n• Analytics tools experience\n• Excellent writing skills",
            date_posted: "3 days ago"
        },
        {
            id: 4,
            job_title: "iOS App Development - Task Management",
            company_name: "ProductiveMind",
            company_email: "dev@productivemind.app",
            category: "mobile-development",
            project_duration: "1-3-months",
            budget: 8000,
            job_description: "Develop a native iOS task management application with features like project creation, team collaboration, deadline tracking, and push notifications. The app should integrate with calendar systems and cloud storage.",
            requirements: "Requirements:\n• Swift programming expertise\n• iOS development experience (3+ years)\n• Core Data proficiency\n• REST API integration\n• Push notifications implementation\n• App Store deployment experience",
            date_posted: "1 week ago"
        },
        {
            id: 5,
            job_title: "Social Media Marketing Campaign",
            company_name: "Lifestyle Brands Inc.",
            company_email: "marketing@lifestylebrands.com",
            category: "marketing",
            project_duration: "1-4-weeks",
            budget: 1500,
            job_description: "Create and execute a comprehensive social media marketing campaign for our new product launch. This includes content creation, scheduling, community management, and performance analytics across Instagram, Facebook, and LinkedIn.",
            requirements: "Requirements:\n• Social media marketing experience\n• Content creation skills\n• Canva or Adobe Creative Suite\n• Analytics tools proficiency\n• Brand voice development\n• Campaign strategy experience",
            date_posted: "4 days ago"
        },
        {
            id: 6,
            job_title: "Python Data Analysis & Visualization",
            company_name: "DataInsights Corp",
            company_email: "analytics@datainsights.com",
            category: "data-science",
            project_duration: "less-than-1-week",
            budget: 800,
            job_description: "Analyze customer behavior data and create interactive visualizations. The project involves cleaning data, performing statistical analysis, and building dashboards to help stakeholders make data-driven decisions.",
            requirements: "Requirements:\n• Python proficiency (Pandas, NumPy)\n• Data visualization (Matplotlib, Plotly)\n• Statistical analysis experience\n• Jupyter Notebook familiarity\n• Dashboard creation skills\n• Business intelligence knowledge",
            date_posted: "5 days ago"
        }
    ];
}

// Create job card element
function createJobCard(job) {
    const jobCard = document.createElement('div');
    jobCard.className = 'job-card';
    
    // Format budget
    const budget = parseFloat(job.budget).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    // Get category display name with icons
    const categoryNames = {
        'web-development': '<i class="fas fa-code"></i> Web Development',
        'mobile-development': '<i class="fas fa-mobile-alt"></i> Mobile Development',
        'design': '<i class="fas fa-palette"></i> Graphic Design',
        'writing': '<i class="fas fa-pen"></i> Content Writing',
        'marketing': '<i class="fas fa-chart-line"></i> Digital Marketing',
        'data-science': '<i class="fas fa-chart-bar"></i> Data Science',
        'consulting': '<i class="fas fa-briefcase"></i> Business Consulting',
        'photography': '<i class="fas fa-camera"></i> Photography',
        'video-editing': '<i class="fas fa-video"></i> Video Editing',
        'other': '<i class="fas fa-tools"></i> Other'
    };
    
    const categoryName = categoryNames[job.category] || job.category;
    
    // Get duration display name with icons
    const durationNames = {
        'less-than-1-week': '<i class="fas fa-bolt"></i> Less than 1 week',
        '1-4-weeks': '<i class="fas fa-calendar"></i> 1-4 weeks',
        '1-3-months': '<i class="fas fa-calendar-alt"></i> 1-3 months',
        '3-6-months': '<i class="fas fa-calendar-check"></i> 3-6 months',
        'more-than-6-months': '<i class="fas fa-hourglass"></i> More than 6 months'
    };
    
    const durationName = durationNames[job.project_duration] || job.project_duration;
    
    // Create job card HTML
    jobCard.innerHTML = `
        <div class="job-header">
            <div>
                <h3 class="job-title">${job.job_title}</h3>
                <p class="job-company"><i class="fas fa-building"></i> ${job.company_name}</p>
            </div>
            <div class="job-budget">${budget}</div>
        </div>
        <div class="job-meta">
            <div class="job-tag">${categoryName}</div>
            <div class="job-tag">${durationName}</div>
        </div>
        <div class="job-description">
            ${job.job_description.length > 200 ? job.job_description.substring(0, 200) + '...' : job.job_description}
        </div>
        <div class="job-actions">
            <button class="btn btn-primary view-job" data-id="${job.id}">
                <i class="fas fa-eye"></i> View Details
            </button>
            <div class="job-date">
                <i class="fas fa-clock"></i> Posted: ${job.date_posted || 'Recently'}
            </div>
        </div>
    `;
    
    // Add event listener to view job button
    jobCard.querySelector('.view-job').addEventListener('click', function() {
        viewJobDetails(job);
    });
    
    return jobCard;
}

// View job details in modal
function viewJobDetails(job) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Format budget
    const budget = parseFloat(job.budget).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    // Get category and duration display names
    const categoryNames = {
        'web-development': 'Web Development',
        'mobile-development': 'Mobile Development',
        'design': 'Graphic Design',
        'writing': 'Content Writing',
        'marketing': 'Digital Marketing',
        'data-science': 'Data Science',
        'consulting': 'Business Consulting',
        'photography': 'Photography',
        'video-editing': 'Video Editing',
        'other': 'Other'
    };
    
    const durationNames = {
        'less-than-1-week': 'Less than 1 week',
        '1-4-weeks': '1-4 weeks',
        '1-3-months': '1-3 months',
        '3-6-months': '3-6 months',
        'more-than-6-months': 'More than 6 months'
    };
    
    // Create modal content
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="modal-header">
                <h1 class="modal-title">${job.job_title}</h1>
                <p class="modal-company"><i class="fas fa-building"></i> ${job.company_name}</p>
                <p class="modal-email"><i class="fas fa-envelope"></i> ${job.company_email}</p>
            </div>
            
            <div class="modal-tags">
                <div class="modal-tag budget-tag">
                    <i class="fas fa-dollar-sign"></i> ${budget}
                </div>
                <div class="modal-tag category-tag">
                    <i class="fas fa-tag"></i> ${categoryNames[job.category] || job.category}
                </div>
                <div class="modal-tag duration-tag">
                    <i class="fas fa-clock"></i> ${durationNames[job.project_duration] || job.project_duration}
                </div>
            </div>
            
            <div class="modal-section">
                <h3><i class="fas fa-file-text"></i> Project Description</h3>
                <p>${job.job_description}</p>
            </div>
            
            <div class="modal-section">
                <h3><i class="fas fa-list-check"></i> Requirements & Skills</h3>
                <p>${job.requirements}</p>
            </div>
            
            <div class="modal-footer">
                <button id="apply-job" class="btn btn-primary">
                    <i class="fas fa-paper-plane"></i> Apply for this Job
                </button>
                <p style="color: #777;">
                    <i class="fas fa-calendar"></i> Posted: ${job.date_posted || 'Recently'}
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('.close-modal').addEventListener('click', function() {
        closeModal(modal);
    });
    
    modal.querySelector('#apply-job').addEventListener('click', function() {
        showApplicationForm(job);
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
}

// Close modal with animation
function closeModal(modal) {
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    setTimeout(() => {
        if (modal.parentElement) {
            document.body.removeChild(modal);
        }
        document.body.style.overflow = 'auto';
    }, 300);
}

// Show application form (placeholder)
function showApplicationForm(job) {
    showNotification(`Application feature coming soon! For now, please contact the employer directly at ${job.company_email}`, 'info');
}

// Reset all filters
function resetFilters() {
    document.getElementById('search').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-duration').value = '';
    loadJobs();
    showNotification('Filters have been reset', 'success');
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    notification.innerHTML = `
        <i class="${icons[type] || icons.info}" style="margin-right: 0.5rem;"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="margin-left: 1rem; background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '10px',
        color: 'white',
        zIndex: '10001',
        display: 'flex',
        alignItems: 'center',
        minWidth: '300px',
        maxWidth: '500px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        backgroundColor: colors[type] || colors.info,
        fontSize: '1rem',
        fontWeight: '500',
        animation: 'slideInRight 0.3s ease-out'
    });
    
    // Add CSS animation keyframes if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}