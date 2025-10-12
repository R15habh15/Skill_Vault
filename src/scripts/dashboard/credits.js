// VCredits Management (Freelancer Credits)
class CreditsManager {
    constructor() {
        this.userCredits = 0;
        this.totalEarnings = 0;
        this.pendingCredits = 0;
        this.transactions = [];
        
        // Exchange rate (1 VCred = ₹9 for freelancers, after 10% platform fee)
        this.EXCHANGE_RATE = 9;
        this.PROCESSING_FEE_RATE = 0.02; // 2%
        this.MIN_WITHDRAWAL = 10;
        
        this.init();
    }

    init() {
        this.loadUserCredits();
        this.updateDashboard();
        this.generateSampleTransactions();
        this.displayTransactions();
        this.setupEventListeners();
    }

    // Load user credits from localStorage
    loadUserCredits() {
        this.userCredits = parseInt(localStorage.getItem('freelancerVCredits') || '0');
        this.totalEarnings = parseFloat(localStorage.getItem('totalEarnings') || '0');
        this.pendingCredits = parseInt(localStorage.getItem('pendingCredits') || '0');
        
        const storedTransactions = localStorage.getItem('freelancerTransactions');
        if (storedTransactions) {
            this.transactions = JSON.parse(storedTransactions);
        }
    }

    // Update dashboard display
    updateDashboard() {
        const creditsBalanceEl = document.getElementById('creditsBalance');
        const totalEarningsEl = document.getElementById('totalEarnings');
        const pendingWithdrawalsEl = document.getElementById('pendingWithdrawals');

        if (creditsBalanceEl) {
            creditsBalanceEl.textContent = this.userCredits.toLocaleString();
        }
        if (totalEarningsEl) {
            totalEarningsEl.textContent = '₹' + this.totalEarnings.toLocaleString();
        }
        if (pendingWithdrawalsEl) {
            pendingWithdrawalsEl.textContent = '₹' + (this.pendingCredits * this.EXCHANGE_RATE).toLocaleString();
        }
    }

    // Initialize empty transactions for new users
    generateSampleTransactions() {
        // Keep transactions empty for new users
        // Transactions will be added when users actually receive credits or make withdrawals
        if (this.transactions.length === 0) {
            // Initialize with empty array - no sample data
            this.transactions = [];
            localStorage.setItem('freelancerTransactions', JSON.stringify(this.transactions));
        }
    }

    // Setup event listeners
    setupEventListeners() {
        const withdrawCredits = document.getElementById('withdrawCredits');
        const withdrawMethod = document.getElementById('withdrawMethod');
        const withdrawBtn = document.getElementById('withdrawBtn');
        const transactionFilter = document.getElementById('transactionFilter');
        const closeModal = document.getElementById('closeModal');
        
        if (withdrawCredits) {
            withdrawCredits.addEventListener('input', () => this.updateConversionAmount());
            // Add max attribute to prevent entering more than available balance
            withdrawCredits.setAttribute('max', this.userCredits);
        }
        
        if (withdrawMethod) {
            withdrawMethod.addEventListener('change', () => this.handleMethodChange());
        }
        
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', () => this.handleWithdrawal());
        }
        
        if (transactionFilter) {
            transactionFilter.addEventListener('change', () => this.filterTransactions());
        }
        
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeSuccessModal());
        }

        // Add CSS animations for notifications if not already present
        this.addNotificationStyles();
    }

    // Add notification styles
    addNotificationStyles() {
        if (!document.getElementById('credits-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'credits-notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Update conversion amount
    updateConversionAmount() {
        const creditsInput = document.getElementById('withdrawCredits');
        const credits = parseInt(creditsInput.value) || 0;
        const grossAmount = credits * this.EXCHANGE_RATE;
        const processingFee = Math.round(grossAmount * this.PROCESSING_FEE_RATE);
        const netAmount = grossAmount - processingFee;
        
        const conversionAmountEl = document.getElementById('conversionAmount');
        const withdrawBtn = document.getElementById('withdrawBtn');
        
        // Update conversion display
        if (conversionAmountEl) {
            if (credits > 0) {
                conversionAmountEl.textContent = '₹' + netAmount.toLocaleString();
                
                // Add validation styling and messages
                if (credits > this.userCredits) {
                    conversionAmountEl.style.color = '#dc3545';
                    conversionAmountEl.textContent = `₹${netAmount.toLocaleString()} (Insufficient Balance!)`;
                    creditsInput.style.borderColor = '#dc3545';
                } else if (credits < this.MIN_WITHDRAWAL && credits > 0) {
                    conversionAmountEl.style.color = '#ffc107';
                    conversionAmountEl.textContent = `₹${netAmount.toLocaleString()} (Min: ${this.MIN_WITHDRAWAL} VCredits)`;
                    creditsInput.style.borderColor = '#ffc107';
                } else {
                    conversionAmountEl.style.color = '#28a745';
                    creditsInput.style.borderColor = '#28a745';
                }
            } else {
                conversionAmountEl.textContent = '₹0';
                conversionAmountEl.style.color = '#666';
                creditsInput.style.borderColor = '';
            }
        }
        
        // Update button state
        if (withdrawBtn) {
            if (credits >= this.MIN_WITHDRAWAL && credits <= this.userCredits) {
                withdrawBtn.disabled = false;
                withdrawBtn.style.opacity = '1';
                withdrawBtn.style.cursor = 'pointer';
            } else {
                withdrawBtn.disabled = true;
                withdrawBtn.style.opacity = '0.6';
                withdrawBtn.style.cursor = 'not-allowed';
            }
        }
    }

    // Handle withdrawal method change
    handleMethodChange() {
        const method = document.getElementById('withdrawMethod').value;
        const accountDetails = document.getElementById('accountDetails');
        
        if (!method || !accountDetails) {
            if (accountDetails) accountDetails.style.display = 'none';
            return;
        }
        
        let fieldsHTML = '';
        
        switch (method) {
            case 'bank':
                fieldsHTML = `
                    <h4 style="color: #333; margin-bottom: 1rem;">Bank Account Details</h4>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">Account Holder Name</label>
                        <input type="text" id="accountHolder" class="form-input" placeholder="Enter account holder name" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">Account Number</label>
                        <input type="text" id="accountNumber" class="form-input" placeholder="Enter account number" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">IFSC Code</label>
                        <input type="text" id="ifscCode" class="form-input" placeholder="Enter IFSC code" required>
                    </div>
                `;
                break;
            case 'upi':
                fieldsHTML = `
                    <h4 style="color: #333; margin-bottom: 1rem;">UPI Details</h4>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">UPI ID</label>
                        <input type="text" id="upiId" class="form-input" placeholder="Enter UPI ID (e.g., user@paytm)" required>
                    </div>
                `;
                break;
            case 'paypal':
                fieldsHTML = `
                    <h4 style="color: #333; margin-bottom: 1rem;">PayPal Details</h4>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">PayPal Email</label>
                        <input type="email" id="paypalEmail" class="form-input" placeholder="Enter PayPal email" required>
                    </div>
                `;
                break;
            case 'paytm':
                fieldsHTML = `
                    <h4 style="color: #333; margin-bottom: 1rem;">Paytm Details</h4>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">Paytm Mobile Number</label>
                        <input type="tel" id="paytmMobile" class="form-input" placeholder="Enter Paytm mobile number" required>
                    </div>
                `;
                break;
        }
        
        accountDetails.innerHTML = fieldsHTML;
        accountDetails.style.display = 'block';
    }

    // Handle withdrawal
    handleWithdrawal() {
        const credits = parseInt(document.getElementById('withdrawCredits').value);
        const method = document.getElementById('withdrawMethod').value;
        
        // Comprehensive validation
        if (!credits || isNaN(credits) || credits <= 0) {
            this.showErrorMessage('Please enter a valid withdrawal amount');
            return;
        }
        
        if (credits < this.MIN_WITHDRAWAL) {
            this.showErrorMessage(`Minimum withdrawal amount is ${this.MIN_WITHDRAWAL} VCredits`);
            return;
        }
        
        if (credits > this.userCredits) {
            this.showErrorMessage(`Insufficient balance! You only have ${this.userCredits} VCredits available. Please enter an amount less than or equal to your current balance.`);
            return;
        }
        
        if (!method) {
            this.showErrorMessage('Please select a withdrawal method');
            return;
        }
        
        // Validate method-specific fields
        if (!this.validateMethodFields(method)) {
            return;
        }
        
        this.processWithdrawal(credits, method);
    }

    // Show error message
    showErrorMessage(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(220, 53, 69, 0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            font-weight: 500;
            max-width: 400px;
            border-left: 4px solid #fff;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                <i class="fas fa-exclamation-triangle" style="margin-top: 0.2rem;"></i>
                <div>
                    <div style="font-weight: bold; margin-bottom: 0.3rem;">Withdrawal Error</div>
                    <div style="font-size: 0.9rem; line-height: 1.4;">${message}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    // Validate method-specific fields
    validateMethodFields(method) {
        switch (method) {
            case 'bank':
                const accountHolder = document.getElementById('accountHolder')?.value?.trim();
                const accountNumber = document.getElementById('accountNumber')?.value?.trim();
                const ifscCode = document.getElementById('ifscCode')?.value?.trim();
                
                if (!accountHolder) {
                    this.showErrorMessage('Please enter the account holder name');
                    return false;
                }
                if (!accountNumber) {
                    this.showErrorMessage('Please enter the account number');
                    return false;
                }
                if (!ifscCode) {
                    this.showErrorMessage('Please enter the IFSC code');
                    return false;
                }
                if (ifscCode.length !== 11) {
                    this.showErrorMessage('IFSC code must be 11 characters long');
                    return false;
                }
                break;
            case 'upi':
                const upiId = document.getElementById('upiId')?.value?.trim();
                if (!upiId) {
                    this.showErrorMessage('Please enter your UPI ID');
                    return false;
                }
                if (!upiId.includes('@')) {
                    this.showErrorMessage('Please enter a valid UPI ID (e.g., user@paytm)');
                    return false;
                }
                break;
            case 'paypal':
                const paypalEmail = document.getElementById('paypalEmail')?.value?.trim();
                if (!paypalEmail) {
                    this.showErrorMessage('Please enter your PayPal email');
                    return false;
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(paypalEmail)) {
                    this.showErrorMessage('Please enter a valid email address');
                    return false;
                }
                break;
            case 'paytm':
                const paytmMobile = document.getElementById('paytmMobile')?.value?.trim();
                if (!paytmMobile) {
                    this.showErrorMessage('Please enter your Paytm mobile number');
                    return false;
                }
                if (!/^\d{10}$/.test(paytmMobile)) {
                    this.showErrorMessage('Please enter a valid 10-digit mobile number');
                    return false;
                }
                break;
        }
        return true;
    }

    // Process withdrawal
    processWithdrawal(credits, method) {
        const grossAmount = credits * this.EXCHANGE_RATE;
        const processingFee = Math.round(grossAmount * this.PROCESSING_FEE_RATE);
        const netAmount = grossAmount - processingFee;
        
        const transaction = {
            id: 'txn_' + Date.now(),
            type: 'withdrawn',
            amount: credits,
            description: `Withdrawal via ${method.toUpperCase()}`,
            date: new Date().toISOString(),
            status: 'pending',
            netAmount: netAmount
        };
        
        this.userCredits -= credits;
        this.pendingCredits += credits;
        this.transactions.unshift(transaction);
        
        localStorage.setItem('freelancerVCredits', this.userCredits.toString());
        localStorage.setItem('pendingCredits', this.pendingCredits.toString());
        localStorage.setItem('freelancerTransactions', JSON.stringify(this.transactions));
        
        this.updateDashboard();
        this.displayTransactions();
        this.showSuccessModal(credits, netAmount);
        this.resetWithdrawalForm();
        
        // Create notification for withdrawal request
        if (window.notificationsManager) {
            window.notificationsManager.notifyWithdrawal(netAmount, 'pending');
        }
    }

    // Show success notification
    showSuccessNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(40, 167, 69, 0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            font-weight: 500;
            max-width: 400px;
            border-left: 4px solid #fff;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // Show success modal
    showSuccessModal(credits, amount) {
        const successCreditsEl = document.getElementById('successCredits');
        const successAmountEl = document.getElementById('successAmount');
        const successModal = document.getElementById('successModal');
        
        if (successCreditsEl) successCreditsEl.textContent = credits;
        if (successAmountEl) successAmountEl.textContent = '₹' + amount.toLocaleString();
        if (successModal) {
            successModal.style.display = 'flex';
            
            // Also show success notification
            this.showSuccessNotification(`Withdrawal request for ${credits} VCredits submitted successfully!`);
        }
    }

    // Close success modal
    closeSuccessModal() {
        const successModal = document.getElementById('successModal');
        if (successModal) {
            successModal.style.display = 'none';
        }
    }

    // Reset withdrawal form
    resetWithdrawalForm() {
        const withdrawCredits = document.getElementById('withdrawCredits');
        const withdrawMethod = document.getElementById('withdrawMethod');
        const accountDetails = document.getElementById('accountDetails');
        const conversionAmount = document.getElementById('conversionAmount');
        const withdrawBtn = document.getElementById('withdrawBtn');
        
        if (withdrawCredits) withdrawCredits.value = '';
        if (withdrawMethod) withdrawMethod.value = '';
        if (accountDetails) accountDetails.style.display = 'none';
        if (conversionAmount) conversionAmount.textContent = '₹0';
        if (withdrawBtn) withdrawBtn.disabled = true;
    }

    // Display transactions
    displayTransactions(filteredTransactions = null) {
        const transactionsList = document.getElementById('transactionsList');
        if (!transactionsList) return;
        
        const transactionsToShow = filteredTransactions || this.transactions;
        
        if (transactionsToShow.length === 0) {
            transactionsList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-receipt" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <h3 style="color: #333; margin-bottom: 0.5rem;">No Transactions Yet</h3>
                    <p>Your transaction history will appear here once you start receiving credits or making withdrawals.</p>
                </div>
            `;
            return;
        }
        
        transactionsList.innerHTML = transactionsToShow.map(transaction => {
            const date = new Date(transaction.date);
            const formattedDate = date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            const formattedTime = date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            let iconClass, amountClass, amountPrefix, iconName;
            
            switch (transaction.type) {
                case 'received':
                    iconClass = 'color: #28a745;';
                    amountClass = 'color: #28a745;';
                    amountPrefix = '+';
                    iconName = 'arrow-down';
                    break;
                case 'withdrawn':
                    iconClass = 'color: #dc3545;';
                    amountClass = 'color: #dc3545;';
                    amountPrefix = '-';
                    iconName = 'arrow-up';
                    break;
                default:
                    iconClass = 'color: #ffc107;';
                    amountClass = 'color: #28a745;';
                    amountPrefix = '+';
                    iconName = 'clock';
            }
            
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: white; border-radius: 10px; border: 1px solid rgba(0,0,0,0.1); margin-bottom: 1rem; transition: all 0.3s ease;"
                     onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
                     onmouseout="this.style.boxShadow='none'">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(102, 126, 234, 0.1); display: flex; align-items: center; justify-content: center; ${iconClass}">
                            <i class="fas fa-${iconName}"></i>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: #333; margin-bottom: 0.2rem;">${transaction.description}</div>
                            <div style="color: #666; font-size: 0.9rem;">${formattedDate} at ${formattedTime}</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; font-size: 1.1rem; ${amountClass}">
                            ${amountPrefix}${transaction.amount} VCreds
                        </div>
                        <div style="font-size: 0.8rem; color: #666; text-transform: capitalize;">
                            ${transaction.status}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Filter transactions
    filterTransactions() {
        const filterType = document.getElementById('transactionFilter')?.value;
        if (!filterType) return;
        
        let filteredTransactions = [...this.transactions];
        
        if (filterType !== 'all') {
            filteredTransactions = filteredTransactions.filter(transaction => {
                return transaction.type === filterType;
            });
        }
        
        this.displayTransactions(filteredTransactions);
    }

    // Simulate receiving credits (for testing)
    simulateReceiveCredits(amount, description) {
        const transaction = {
            id: 'txn_' + Date.now(),
            type: 'received',
            amount: amount,
            description: description,
            date: new Date().toISOString(),
            status: 'completed'
        };
        
        this.userCredits += amount;
        this.totalEarnings += amount * this.EXCHANGE_RATE;
        this.transactions.unshift(transaction);
        
        localStorage.setItem('freelancerVCredits', this.userCredits.toString());
        localStorage.setItem('totalEarnings', this.totalEarnings.toString());
        localStorage.setItem('freelancerTransactions', JSON.stringify(this.transactions));
        
        this.updateDashboard();
        this.displayTransactions();
    }

    // Refresh credits data (for external calls)
    refreshCredits() {
        this.loadUserCredits();
        this.updateDashboard();
        this.displayTransactions();
    }

    // Get credits statistics
    getCreditsStats() {
        return {
            userCredits: this.userCredits,
            totalEarnings: this.totalEarnings,
            pendingCredits: this.pendingCredits,
            transactionCount: this.transactions.length,
            exchangeRate: this.EXCHANGE_RATE
        };
    }
}

// Create global credits manager instance
window.creditsManager = new CreditsManager();