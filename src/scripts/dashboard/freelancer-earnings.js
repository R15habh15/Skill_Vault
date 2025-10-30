// Freelancer Earnings Management

class FreelancerEarningsManager {
    constructor() {
        this.userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (this.userInfo && this.userInfo.user_type === 'freelancer') {
            this.init();
        }
    }

    init() {
        this.loadEarnings();
        setInterval(() => this.loadEarnings(), 30000);
    }

    async loadEarnings() {
        if (!this.userInfo) return;

        try {
            // Load credits balance
            const creditsResponse = await fetch(`/api/credits/balance/${this.userInfo.id}`);
            const creditsData = await creditsResponse.json();

            if (creditsData.success) {
                this.updateEarningsDisplay(creditsData);
            }

            // Load transactions
            this.loadTransactions();

        } catch (err) {
            console.error('Error loading earnings:', err);
        }
    }

    updateEarningsDisplay(data) {
        const balanceElement = document.getElementById('freelancer-credits-balance');
        const totalEarnedElement = document.getElementById('total-earned');
        const pendingPaymentsElement = document.getElementById('pending-payments');

        if (balanceElement) {
            balanceElement.textContent = data.balance || 0;
        }

        if (totalEarnedElement) {
            totalEarnedElement.textContent = `₹${(data.totalEarned || 0) * 10}`;
        }

        if (pendingPaymentsElement) {
            pendingPaymentsElement.textContent = data.pendingPayments || 0;
        }
    }

    async loadTransactions() {
        const container = document.getElementById('freelancer-transactions-list');
        if (!container) return;

        try {
            const response = await fetch(`/api/credits/transactions/${this.userInfo.id}?type=earned`);
            const data = await response.json();

            if (data.success) {
                this.displayTransactions(data.transactions, container);
            }
        } catch (err) {
            console.error('Error loading transactions:', err);
            container.innerHTML = '<p style="text-align: center; color: #666;">Failed to load transactions</p>';
        }
    }

    displayTransactions(transactions, container) {
        if (transactions.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-receipt" style="font-size: 2rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                    <p>No earnings yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = transactions.map(txn => `
            <div class="transaction-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <i class="fas fa-${this.getTransactionIcon(txn.type)}" style="color: ${this.getTransactionColor(txn.type)};"></i>
                        <strong style="color: #333;">${txn.description}</strong>
                    </div>
                    <div style="font-size: 0.85rem; color: #666;">
                        <i class="fas fa-calendar"></i> ${new Date(txn.created_at).toLocaleString()}
                    </div>
                    ${txn.status ? `
                        <span class="badge" style="background: ${this.getStatusColor(txn.status)}; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; margin-top: 0.25rem; display: inline-block;">
                            ${txn.status}
                        </span>
                    ` : ''}
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.25rem; font-weight: bold; color: ${this.getTransactionColor(txn.type)};">
                        +${txn.credits} VCreds
                    </div>
                    <div style="font-size: 0.85rem; color: #666;">
                        ₹${txn.credits * 10}
                    </div>
                </div>
            </div>
        `).join('');
    }

    getTransactionIcon(type) {
        const icons = {
            earned: 'coins',
            project_payment: 'briefcase',
            bonus: 'gift',
            refund: 'undo'
        };
        return icons[type] || 'coins';
    }

    getTransactionColor(type) {
        const colors = {
            earned: '#28a745',
            project_payment: '#28a745',
            bonus: '#17a2b8',
            refund: '#ffc107'
        };
        return colors[type] || '#28a745';
    }

    getStatusColor(status) {
        const colors = {
            completed: '#28a745',
            pending: '#ffc107',
            failed: '#dc3545'
        };
        return colors[status] || '#6c757d';
    }

    async requestWithdrawal() {
        const amount = prompt('Enter amount to withdraw (VCreds):');
        
        if (!amount || isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        try {
            const response = await fetch('/api/credits/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.userInfo.id,
                    amount: parseInt(amount)
                })
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ Withdrawal Completed!\n\nAmount: ${amount} VCreds (₹${amount * 10})\nNew Balance: ${data.newBalance} VCreds\n\nThe amount has been processed and deducted from your balance.`);
                this.loadEarnings();
            } else {
                alert('❌ Failed to withdraw: ' + data.message);
            }
        } catch (err) {
            console.error('Error requesting withdrawal:', err);
            alert('Failed to request withdrawal');
        }
    }
}

// Initialize when DOM is ready
let freelancerEarningsManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        freelancerEarningsManager = new FreelancerEarningsManager();
        window.freelancerEarningsManager = freelancerEarningsManager;
    });
} else {
    freelancerEarningsManager = new FreelancerEarningsManager();
    window.freelancerEarningsManager = freelancerEarningsManager;
}
