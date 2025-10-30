// Premium Subscription Manager
class PremiumSubscriptionManager {
    constructor() {
        this.userInfo = JSON.parse(localStorage.getItem('userInfo'));
        this.currentSubscription = null;
        this.plans = [];
        this.razorpayKey = null;
        this.init();
    }

    async init() {
        if (!this.userInfo) return;

        await this.loadRazorpayKey();
        await this.loadCurrentSubscription();
        await this.loadPlans();
        this.updatePremiumBadges();
        this.setupEventListeners();
    }

    async loadRazorpayKey() {
        try {
            const response = await fetch('/api/config/razorpay-key');
            const data = await response.json();
            if (data.success) {
                this.razorpayKey = data.key;
            }
        } catch (err) {
            console.error('Error loading Razorpay key:', err);
        }
    }

    async loadCurrentSubscription() {
        try {
            const response = await fetch(`/api/premium/user/${this.userInfo.id}`);
            const data = await response.json();

            if (data.success) {
                this.currentSubscription = data.subscription;
                this.updateSubscriptionDisplay();
            }
        } catch (err) {
            console.error('Error loading subscription:', err);
        }
    }

    async loadPlans() {
        try {
            const response = await fetch(`/api/premium/plans?userType=${this.userInfo.user_type}`);
            const data = await response.json();

            if (data.success && data.plans) {
                this.plans = data.plans;
                this.displayPlans();
            } else {
                console.error('No plans found in response:', data);
                this.plans = [];
            }
        } catch (err) {
            console.error('Error loading plans:', err);
            this.plans = [];
        }
    }

    updateSubscriptionDisplay() {
        const statusEl = document.getElementById('premium-status');
        const detailsEl = document.getElementById('premium-details');

        if (!statusEl) return;

        if (this.currentSubscription) {
            const endDate = new Date(this.currentSubscription.end_date);
            const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));

            statusEl.innerHTML = `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; border-radius: 15px; color: white; margin-bottom: 2rem;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <i class="fas fa-crown" style="font-size: 2rem;"></i>
                        <div>
                            <h3 style="margin: 0; color: white;">Premium Active</h3>
                            <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">${this.currentSubscription.plan_name}</p>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <p style="margin: 0; opacity: 0.9; font-size: 0.9rem;">Expires on</p>
                            <p style="margin: 0.25rem 0 0 0; font-size: 1.1rem; font-weight: bold;">${endDate.toLocaleDateString()}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin: 0; opacity: 0.9; font-size: 0.9rem;">Days remaining</p>
                            <p style="margin: 0.25rem 0 0 0; font-size: 1.5rem; font-weight: bold;">${daysLeft}</p>
                        </div>
                    </div>
                </div>
            `;

            if (detailsEl) {
                this.displayPremiumFeatures(detailsEl);
            }
        } else {
            statusEl.innerHTML = `
                <div style="background: #f8f9fa; padding: 2rem; border-radius: 15px; text-align: center; margin-bottom: 2rem;">
                    <i class="fas fa-crown" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
                    <h3 style="color: #666;">No Active Premium</h3>
                    <p style="color: #999;">Upgrade to premium to unlock exclusive features</p>
                    <button onclick="premiumManager.showUpgradeModal()" class="apply-btn" style="margin-top: 1rem;">
                        <i class="fas fa-star"></i> Upgrade Now
                    </button>
                </div>
            `;
        }
    }

    displayPremiumFeatures(container) {
        if (!this.currentSubscription || !this.currentSubscription.features) return;

        const features = this.currentSubscription.features;
        const isCompany = this.userInfo.user_type === 'company';

        const featuresList = isCompany ? [
            { key: 'priority_listings', icon: 'fa-arrow-up', label: 'Priority Job Listings' },
            { key: 'unlimited_jobs', icon: 'fa-infinity', label: 'Unlimited Job Postings' },
            { key: 'advanced_analytics', icon: 'fa-chart-line', label: 'Advanced Analytics' },
            { key: 'featured_badge', icon: 'fa-badge-check', label: 'Featured Company Badge' },
            { key: 'priority_support', icon: 'fa-headset', label: 'Priority Support' },
            { key: 'advanced_search', icon: 'fa-search-plus', label: 'Advanced Search Filters' },
            { key: 'project_insights', icon: 'fa-lightbulb', label: 'Detailed Project Insights' }
        ] : [
            { key: 'featured_profile', icon: 'fa-star', label: 'Featured Profile Badge' },
            { key: 'priority_search', icon: 'fa-arrow-up', label: 'Priority in Search' },
            { key: 'reduced_fees', icon: 'fa-percentage', label: 'Reduced Platform Fees (5%)' },
            { key: 'advanced_analytics', icon: 'fa-chart-bar', label: 'Advanced Analytics' },
            { key: 'instant_alerts', icon: 'fa-bell', label: 'Instant Job Alerts' },
            { key: 'unlimited_applications', icon: 'fa-infinity', label: 'Unlimited Applications' },
            { key: 'premium_courses', icon: 'fa-graduation-cap', label: 'Premium Courses Access' }
        ];

        container.innerHTML = `
            <h4 style="margin-bottom: 1rem;">Your Premium Features</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                ${featuresList.map(feature => `
                    <div style="background: white; padding: 1rem; border-radius: 10px; border: 2px solid ${features[feature.key] ? '#667eea' : '#eee'};">
                        <i class="fas ${feature.icon}" style="color: ${features[feature.key] ? '#667eea' : '#ccc'}; margin-right: 0.5rem;"></i>
                        <span style="color: ${features[feature.key] ? '#333' : '#999'};">${feature.label}</span>
                        ${features[feature.key] ? '<i class="fas fa-check-circle" style="color: #28a745; float: right;"></i>' : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    displayPlans() {
        const container = document.getElementById('premium-plans-container');
        if (!container) {
            console.warn('Premium plans container not found');
            return;
        }

        if (!this.plans || !this.plans.length) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No premium plans available at the moment.</p>';
            return;
        }

        const isCompany = this.userInfo.user_type === 'company';

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem;">
                ${this.plans.map((plan, index) => {
            const features = plan.features;
            const discount = features.discount || null;
            const isPopular = index === 1; // Middle plan is popular

            return `
                        <div style="background: white; border-radius: 15px; padding: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.1); position: relative; ${isPopular ? 'border: 3px solid #667eea; transform: scale(1.05);' : 'border: 1px solid #eee;'}">
                            ${isPopular ? '<div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #667eea; color: white; padding: 0.5rem 1.5rem; border-radius: 20px; font-size: 0.85rem; font-weight: bold;">MOST POPULAR</div>' : ''}
                            
                            <div style="text-align: center; margin-bottom: 2rem;">
                                <h3 style="color: #333; margin-bottom: 0.5rem;">${plan.name.replace(isCompany ? 'Company ' : 'Freelancer ', '')}</h3>
                                <div style="font-size: 2.5rem; font-weight: bold; color: #667eea; margin: 1rem 0;">
                                    ₹${plan.price_inr.toLocaleString()}
                                </div>
                                <p style="color: #999; font-size: 0.9rem;">per ${plan.duration_days} days</p>
                                ${discount ? `<span style="background: #28a745; color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.85rem;">Save ${discount}</span>` : ''}
                            </div>
                            
                            <div style="margin-bottom: 2rem;">
                                ${this.getFeaturesList(features, isCompany).map(feature => `
                                    <div style="display: flex; align-items: center; margin-bottom: 0.75rem;">
                                        <i class="fas fa-check-circle" style="color: #28a745; margin-right: 0.75rem;"></i>
                                        <span style="color: #666;">${feature}</span>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <button onclick="premiumManager.selectPlan(${plan.id})" class="apply-btn" style="width: 100%; background: ${isPopular ? '#667eea' : '#764ba2'};">
                                <i class="fas fa-crown"></i> Choose Plan
                            </button>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    }

    getFeaturesList(features, isCompany) {
        if (isCompany) {
            return [
                'Priority job listings',
                'Unlimited job postings',
                'Advanced analytics dashboard',
                'Featured company badge',
                'Priority customer support',
                'Advanced freelancer search',
                'Detailed project insights'
            ];
        } else {
            return [
                'Featured profile badge',
                'Priority in search results',
                `Reduced fees (${features.fee_percentage || 5}%)`,
                'Advanced earnings analytics',
                'Instant job alerts',
                'Unlimited job applications',
                'Access to premium courses'
            ];
        }
    }

    async selectPlan(planId) {
        const plan = this.plans.find(p => p.id === planId);
        if (!plan) return;

        this.showPaymentModal(plan);
    }

    showPaymentModal(plan) {
        const modal = document.createElement('div');
        modal.id = 'premium-payment-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';

        modal.innerHTML = `
            <div style="background: white; border-radius: 20px; padding: 2rem; max-width: 500px; width: 90%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3 style="margin: 0;">Complete Payment</h3>
                    <button onclick="document.getElementById('premium-payment-modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
                    <h4 style="margin: 0 0 1rem 0;">${plan.name}</h4>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Duration:</span>
                        <strong>${plan.duration_days} days</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 1.2rem; color: #667eea; font-weight: bold; margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #ddd;">
                        <span>Total:</span>
                        <span>₹${plan.price_inr.toLocaleString()}</span>
                    </div>
                </div>
                
                <div style="margin-bottom: 1rem; padding: 1rem; background: #e8f4f8; border-radius: 8px; border-left: 4px solid #667eea;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <i class="fas fa-shield-alt" style="color: #667eea;"></i>
                        <strong>Secure Payment via Razorpay</strong>
                    </div>
                    <p style="margin: 0; font-size: 0.9rem; color: #666;">
                        Pay securely using Credit/Debit Card, UPI, Net Banking, or Wallet
                    </p>
                </div>
                
                <button onclick="premiumManager.processPremiumPayment(${plan.id})" class="apply-btn" style="width: 100%; padding: 1rem; font-size: 1.1rem;">
                    <i class="fas fa-lock"></i> Proceed to Secure Payment
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async processPremiumPayment(planId) {
        const plan = this.plans.find(p => p.id === planId);

        try {
            const response = await fetch('/api/premium/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: planId,
                    userId: this.userInfo.id
                })
            });

            const data = await response.json();

            if (!data.success) {
                alert(data.message || 'Failed to create order');
                return;
            }

            // Initiate Razorpay payment
            this.initiateRazorpayPayment(data.order, plan);
        } catch (err) {
            console.error('Error processing payment:', err);
            alert('Payment failed. Please try again.');
        }
    }

    initiateRazorpayPayment(order, plan) {
        if (!this.razorpayKey) {
            alert('Payment system not configured. Please try again.');
            return;
        }

        const options = {
            key: this.razorpayKey,
            amount: order.amount,
            currency: order.currency,
            name: 'Skill Vault Premium',
            description: plan.name,
            order_id: order.id,
            handler: async (response) => {
                await this.verifyPremiumPayment(response, plan.id);
            },
            prefill: {
                name: this.userInfo.username,
                email: this.userInfo.email
            },
            theme: {
                color: '#667eea'
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();

        document.getElementById('premium-payment-modal').remove();
    }

    async verifyPremiumPayment(paymentResponse, planId) {
        try {
            const response = await fetch('/api/premium/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    razorpay_order_id: paymentResponse.razorpay_order_id,
                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                    razorpay_signature: paymentResponse.razorpay_signature,
                    userId: this.userInfo.id,
                    planId: planId
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Premium subscription activated successfully! 🎉');
                await this.loadCurrentSubscription();
                location.reload();
            } else {
                alert('Payment verification failed');
            }
        } catch (err) {
            console.error('Error verifying payment:', err);
            alert('Payment verification failed');
        }
    }

    updatePremiumBadges() {
        if (!this.currentSubscription) return;

        // Add premium badge to user profile
        const profileElements = document.querySelectorAll('.profile-name, .user-name');
        profileElements.forEach(el => {
            if (!el.querySelector('.premium-badge')) {
                const badge = document.createElement('span');
                badge.className = 'premium-badge';
                badge.innerHTML = '<i class="fas fa-crown" style="color: #FFD700; margin-left: 0.5rem;"></i>';
                badge.title = 'Premium Member';
                el.appendChild(badge);
            }
        });
    }

    showUpgradeModal() {
        // Navigate to premium section
        if (window.navigationManager) {
            window.navigationManager.showSection('premium');
        }
    }

    setupEventListeners() {
        // Add any additional event listeners here
    }
}

// Initialize premium manager
let premiumManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        premiumManager = new PremiumSubscriptionManager();
        window.premiumManager = premiumManager;
    });
} else {
    premiumManager = new PremiumSubscriptionManager();
    window.premiumManager = premiumManager;
}
