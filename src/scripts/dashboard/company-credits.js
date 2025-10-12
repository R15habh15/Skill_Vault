// Company VCreds Management
class CompanyCreditsManager {
    constructor() {
        this.balance = 0;
        this.totalSpent = 0;
        this.transactions = [];
        this.EXCHANGE_RATE = 10; // 1 VCred = ₹10 for companies
        this.init();
    }

    init() {
        this.loadCreditsData();
        this.updateDisplay();
        this.loadTransactions();
        this.setupEventListeners();
        this.hideSuccessModal(); // Ensure modal is hidden on init
    }

    // Load credits data from localStorage
    loadCreditsData() {
        this.balance = parseInt(localStorage.getItem('company_vcreds_balance') || '0');
        this.totalSpent = parseFloat(localStorage.getItem('company_total_spent') || '0');
        
        const storedTransactions = localStorage.getItem('company_transactions');
        if (storedTransactions) {
            this.transactions = JSON.parse(storedTransactions);
        } else {
            this.generateSampleTransactions();
        }
    }

    // Update display elements
    updateDisplay() {
        const elements = {
            'company-credits-balance': this.balance,
            'total-spent': `₹${this.totalSpent.toLocaleString()}`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // Initialize empty transactions for new companies
    generateSampleTransactions() {
        // Clear any existing dummy data
        localStorage.removeItem('company_transactions');
        this.transactions = [];
        this.saveTransactions();
    }

    // Load and display transactions
    loadTransactions() {
        const transactionsList = document.getElementById('company-transactions-list');
        if (!transactionsList) return;

        if (this.transactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-receipt" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No Transactions Yet</h3>
                    <p>Your transaction history will appear here</p>
                </div>
            `;
            return;
        }

        const transactionsHTML = this.transactions.map(transaction => {
            const isCredit = transaction.type === 'purchase';
            const icon = isCredit ? 'fas fa-plus-circle' : 'fas fa-minus-circle';
            const iconColor = isCredit ? '#28a745' : '#dc3545';
            const amountPrefix = isCredit ? '+' : '-';
            
            return `
                <div class="transaction-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid #eee;">
                    <div class="transaction-icon" style="background: ${iconColor}15; color: ${iconColor}; padding: 0.75rem; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
                        <i class="${icon}"></i>
                    </div>
                    <div class="transaction-details" style="flex: 1;">
                        <h4 style="margin: 0 0 0.25rem 0; color: #333;">${transaction.description}</h4>
                        <p style="margin: 0; color: #666; font-size: 0.9rem;">
                            ${new Date(transaction.date).toLocaleDateString()} • ${transaction.id}
                        </p>
                    </div>
                    <div class="transaction-amount" style="text-align: right;">
                        <div style="font-weight: bold; color: ${iconColor};">
                            ${amountPrefix}${transaction.credits} VCreds
                        </div>
                        <div style="color: #666; font-size: 0.9rem;">
                            ₹${transaction.amount.toLocaleString()}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        transactionsList.innerHTML = transactionsHTML;
    }

    // Setup event listeners
    setupEventListeners() {
        // Purchase button
        const purchaseBtn = document.getElementById('purchase-btn');
        if (purchaseBtn) {
            purchaseBtn.addEventListener('click', () => {
                this.handlePurchase();
            });
        }

        // Transaction filter
        const transactionFilter = document.getElementById('company-transaction-filter');
        if (transactionFilter) {
            transactionFilter.addEventListener('change', (e) => {
                this.filterTransactions(e.target.value);
            });
        }

        // Custom credits input
        const customCreditsInput = document.getElementById('custom-credits');
        if (customCreditsInput) {
            customCreditsInput.addEventListener('input', (e) => {
                this.updateCustomCost(e.target.value);
            });
        }

        // Package selection event listeners (alternative to onclick)
        const packageElements = document.querySelectorAll('.credit-package');
        packageElements.forEach(pkg => {
            pkg.addEventListener('click', (e) => {
                const credits = parseInt(pkg.dataset.credits);
                const cost = parseInt(pkg.dataset.cost);
                if (credits && cost) {
                    console.log('Package clicked via event listener:', credits, cost);
                    this.selectPackageHandler(credits, cost, pkg);
                }
            });
        });
    }

    // Package selection handler (alternative method)
    selectPackageHandler(credits, cost, element) {
        const customCreditsInput = document.getElementById('custom-credits');
        if (customCreditsInput) {
            customCreditsInput.value = credits;
            this.updateCustomCost(credits);
        }
        
        // Highlight selected package
        document.querySelectorAll('.credit-package').forEach(pkg => {
            pkg.style.borderColor = '#e0e0e0';
            pkg.style.background = 'white';
        });
        
        if (element) {
            element.style.borderColor = '#667eea';
            element.style.background = '#f8f9ff';
        }
    }

    // Handle VCreds purchase
    async handlePurchase() {
        console.log('Purchase button clicked'); // Debug log
        
        const customCreditsInput = document.getElementById('custom-credits');
        const purchaseBtn = document.getElementById('purchase-btn');
        const credits = parseInt(customCreditsInput.value);
        
        console.log('Credits to purchase:', credits); // Debug log
        
        if (!credits || credits < 10) {
            alert('Please enter a valid amount (minimum 10 VCreds)');
            return;
        }

        const amount = credits * this.EXCHANGE_RATE;
        
        // Confirm purchase
        const confirmed = confirm(`Purchase ${credits} VCreds for ₹${amount.toLocaleString()}?`);
        if (!confirmed) return;

        // Show loading state
        const originalText = purchaseBtn.innerHTML;
        purchaseBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        purchaseBtn.disabled = true;

        try {
            // Initiate Razorpay payment
            await this.initiateRazorpayPayment(credits, amount);
            
        } catch (error) {
            console.error('Purchase failed:', error);
            alert('Purchase failed. Please try again.');
        } finally {
            // Restore button state
            purchaseBtn.innerHTML = originalText;
            purchaseBtn.disabled = credits < 10;
        }
    }

    // Initiate Razorpay payment
    async initiateRazorpayPayment(credits, amount) {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.id) {
            alert('Please log in to purchase credits');
            return;
        }

        // Check if Razorpay is loaded
        if (typeof Razorpay === 'undefined') {
            alert('Payment system is loading. Please try again in a moment.');
            return;
        }

        try {
            console.log('Creating Razorpay order for company credits...');
            
            // Create order on server
            const orderResponse = await fetch('/api/company/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: amount,
                    credits: credits,
                    userId: userInfo.id
                })
            });

            const orderData = await orderResponse.json();
            
            if (!orderData.success) {
                throw new Error(orderData.message);
            }

            console.log('Order created:', orderData.order);

            // Open Razorpay checkout
            this.openRazorpayCheckout(orderData.order, credits, amount);

        } catch (error) {
            console.error('Error creating order:', error);
            alert('Failed to create order: ' + error.message);
        }
    }

    // Open Razorpay checkout
    openRazorpayCheckout(order, credits, amount) {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        
        const options = {
            key: CONFIG.RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'Skill Vault',
            description: `Purchase ${credits} VCreds`,
            order_id: order.id,
            prefill: {
                name: userInfo.username,
                email: userInfo.email
            },
            theme: {
                color: '#667eea'
            },
            handler: (response) => {
                console.log('Payment successful:', response);
                this.verifyPayment(response, credits);
            },
            modal: {
                ondismiss: () => {
                    console.log('Payment cancelled by user');
                }
            }
        };

        console.log('Opening Razorpay checkout...');
        const rzp = new Razorpay(options);
        
        rzp.on('payment.failed', (response) => {
            console.error('Payment failed:', response.error);
            alert('Payment failed: ' + response.error.description);
        });

        rzp.open();
    }

    // Verify payment with server
    async verifyPayment(paymentResponse, credits) {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        
        try {
            console.log('Verifying payment...');
            
            const verifyResponse = await fetch('/api/company/verify-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    razorpay_order_id: paymentResponse.razorpay_order_id,
                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                    razorpay_signature: paymentResponse.razorpay_signature,
                    userId: userInfo.id
                })
            });

            const verifyData = await verifyResponse.json();
            
            if (verifyData.success) {
                // Update local balance
                this.balance += credits;
                
                // Add transaction record
                const transaction = {
                    id: paymentResponse.razorpay_payment_id,
                    type: 'purchase',
                    amount: credits * this.EXCHANGE_RATE,
                    credits: credits,
                    description: `VCreds Purchase - ${credits} Credits`,
                    date: new Date().toISOString(),
                    status: 'completed'
                };
                
                this.transactions.unshift(transaction);
                
                // Save and update display
                this.saveData();
                this.updateDisplay();
                this.loadTransactions();
                
                // Update main dashboard stats
                if (window.companyDashboard) {
                    window.companyDashboard.updateStats();
                }
                
                // Clear form
                const customCreditsInput = document.getElementById('custom-credits');
                if (customCreditsInput) {
                    customCreditsInput.value = '';
                    this.updateCustomCost(0);
                }
                
                // Show success modal
                this.showSuccessModal(credits, credits * this.EXCHANGE_RATE);
                
            } else {
                throw new Error(verifyData.message);
            }

        } catch (error) {
            console.error('Payment verification failed:', error);
            
            // Show user-friendly error message
            const errorMsg = error.message.includes('fetch') 
                ? 'Network error. Please check your connection and try again.'
                : 'Payment verification failed: ' + error.message;
                
            alert(errorMsg);
        }
    }



    // Save data to localStorage
    saveData() {
        localStorage.setItem('company_vcreds_balance', this.balance.toString());
        localStorage.setItem('company_total_spent', this.totalSpent.toString());
        this.saveTransactions();
    }

    // Save transactions to localStorage
    saveTransactions() {
        localStorage.setItem('company_transactions', JSON.stringify(this.transactions));
    }

    // Filter transactions
    filterTransactions(filter) {
        let filteredTransactions = this.transactions;
        
        if (filter !== 'all') {
            filteredTransactions = this.transactions.filter(t => t.type === filter);
        }
        
        // Update display with filtered transactions
        const transactionsList = document.getElementById('company-transactions-list');
        if (!transactionsList) return;

        if (filteredTransactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-filter" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No Transactions Found</h3>
                    <p>No transactions match the selected filter</p>
                </div>
            `;
            return;
        }

        const transactionsHTML = filteredTransactions.map(transaction => {
            const isCredit = transaction.type === 'purchase';
            const icon = isCredit ? 'fas fa-plus-circle' : 'fas fa-minus-circle';
            const iconColor = isCredit ? '#28a745' : '#dc3545';
            const amountPrefix = isCredit ? '+' : '-';
            
            return `
                <div class="transaction-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid #eee;">
                    <div class="transaction-icon" style="background: ${iconColor}15; color: ${iconColor}; padding: 0.75rem; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
                        <i class="${icon}"></i>
                    </div>
                    <div class="transaction-details" style="flex: 1;">
                        <h4 style="margin: 0 0 0.25rem 0; color: #333;">${transaction.description}</h4>
                        <p style="margin: 0; color: #666; font-size: 0.9rem;">
                            ${new Date(transaction.date).toLocaleDateString()} • ${transaction.id}
                        </p>
                    </div>
                    <div class="transaction-amount" style="text-align: right;">
                        <div style="font-weight: bold; color: ${iconColor};">
                            ${amountPrefix}${transaction.credits} VCreds
                        </div>
                        <div style="color: #666; font-size: 0.9rem;">
                            ₹${transaction.amount.toLocaleString()}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        transactionsList.innerHTML = transactionsHTML;
    }

    // Update custom cost calculation
    updateCustomCost(credits) {
        const costElement = document.getElementById('custom-cost');
        const purchaseBtn = document.getElementById('purchase-btn');
        
        if (costElement && purchaseBtn) {
            const amount = parseInt(credits) || 0;
            const cost = amount * this.EXCHANGE_RATE;
            
            costElement.textContent = `₹${cost.toLocaleString()}`;
            purchaseBtn.disabled = amount < 10;
        }
    }

    // Hide success modal on initialization
    hideSuccessModal() {
        const modal = document.getElementById('purchase-success-modal');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
        
        // Clear any temporary purchase data that might cause issues
        localStorage.removeItem('temp_purchase_data');
        localStorage.removeItem('show_success_modal');
    }

    // Show success modal
    showSuccessModal(credits, amount) {
        const modal = document.getElementById('purchase-success-modal');
        const successCredits = document.getElementById('success-credits');
        const successAmount = document.getElementById('success-amount');
        const successBalance = document.getElementById('success-balance');
        const closeBtn = document.getElementById('close-success-modal');

        if (modal && successCredits && successAmount && successBalance) {
            successCredits.textContent = credits.toLocaleString();
            successAmount.textContent = `₹${amount.toLocaleString()}`;
            successBalance.textContent = `${this.balance.toLocaleString()} VCreds`;
            
            // Show modal by adding class and setting display
            modal.classList.add('show');
            modal.style.display = 'flex';
            
            // Close modal handler
            const closeModal = () => {
                modal.classList.remove('show');
                modal.style.display = 'none';
            };
            
            closeBtn.onclick = closeModal;
            modal.onclick = (e) => {
                if (e.target === modal) closeModal();
            };
        }
    }

    // Spend credits (for hiring freelancers)
    spendCredits(amount, description) {
        if (amount > this.balance) {
            throw new Error('Insufficient VCreds balance');
        }
        
        this.balance -= amount;
        
        // Add transaction record
        const transaction = {
            id: `TXN${Date.now()}`,
            type: 'spent',
            amount: amount * this.EXCHANGE_RATE,
            credits: amount,
            description: description,
            date: new Date().toISOString(),
            status: 'completed'
        };
        
        this.transactions.unshift(transaction);
        this.saveData();
        this.updateDisplay();
        this.loadTransactions();
    }
}

// Package selection for credit purchase
function selectPackage(credits, cost, element) {
    console.log('selectPackage called with:', credits, cost); // Debug log
    
    try {
        const customCreditsInput = document.getElementById('custom-credits');
        if (customCreditsInput) {
            customCreditsInput.value = credits;
            console.log('Set input value to:', credits); // Debug log
            
            // Trigger the input event to update cost display
            const inputEvent = new Event('input', { bubbles: true });
            customCreditsInput.dispatchEvent(inputEvent);
            
            // Also manually update cost if manager is available
            if (window.companyCreditsManager) {
                window.companyCreditsManager.updateCustomCost(credits);
            }
        }
        
        // Highlight selected package
        document.querySelectorAll('.credit-package').forEach(pkg => {
            pkg.style.borderColor = '#e0e0e0';
            pkg.style.background = 'white';
        });
        
        // Find the clicked package element
        const packageElement = element || (window.event && window.event.target ? window.event.target.closest('.credit-package') : null);
        if (packageElement) {
            packageElement.style.borderColor = '#667eea';
            packageElement.style.background = '#f8f9ff';
            console.log('Highlighted package'); // Debug log
        }
        
        // Show temporary feedback
        const purchaseBtn = document.getElementById('purchase-btn');
        if (purchaseBtn) {
            const originalText = purchaseBtn.innerHTML;
            purchaseBtn.innerHTML = `<i class="fas fa-check"></i> ${credits} VCreds Selected`;
            setTimeout(() => {
                purchaseBtn.innerHTML = originalText;
            }, 1000);
        }
        
    } catch (error) {
        console.error('Error in selectPackage:', error);
    }
}

// Initialize company credits manager
let companyCreditsManager;
document.addEventListener('DOMContentLoaded', () => {
    companyCreditsManager = new CompanyCreditsManager();
});

// Reset all company data (for testing/debugging)
function resetCompanyData() {
    const companyKeys = [
        'company_jobs',
        'company_applications',
        'company_transactions',
        'company_vcreds_balance',
        'company_total_spent',
        'company_active_jobs',
        'company_total_applications',
        'company_hired_count'
    ];
    
    companyKeys.forEach(key => localStorage.removeItem(key));
    
    // Reload the page to refresh all data
    window.location.reload();
}

// Make it globally available
window.companyCreditsManager = companyCreditsManager;
window.selectPackage = selectPackage;
window.resetCompanyData = resetCompanyData;