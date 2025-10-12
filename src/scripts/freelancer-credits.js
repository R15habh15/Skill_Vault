// Global variables
let currentSection = null;
let userCredits = 0;
let totalEarnings = 0;
let pendingCredits = 0;
let transactions = [];

// Exchange rate (1 VCred = ₹9 for freelancers, after 10% platform fee)
const EXCHANGE_RATE = 9;
const PROCESSING_FEE_RATE = 0.02; // 2%
const MIN_WITHDRAWAL = 10;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadUserData();
    initializeEventListeners();
});

// Initialize dashboard
function initializeDashboard() {
    loadUserCredits();
    updateDashboard();
    generateSampleTransactions();
    displayTransactions();
}

// Load user data
function loadUserData() {
    const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        joinDate: '2024-01-15'
    };
    
    document.getElementById('userName').textContent = userData.name;
}

// Load user credits from localStorage
function loadUserCredits() {
    userCredits = parseInt(localStorage.getItem('freelancerVCredits') || '0');
    totalEarnings = parseFloat(localStorage.getItem('totalEarnings') || '0');
    pendingCredits = parseInt(localStorage.getItem('pendingCredits') || '0');
    
    const storedTransactions = localStorage.getItem('freelancerTransactions');
    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    }
}

// Update dashboard display
function updateDashboard() {
    document.getElementById('creditsBalance').textContent = userCredits.toLocaleString();
    document.getElementById('totalEarnings').textContent = '₹' + totalEarnings.toLocaleString();
    document.getElementById('pendingWithdrawals').textContent = '₹' + (pendingCredits * EXCHANGE_RATE).toLocaleString();
}

// Generate sample transactions for demo
function generateSampleTransactions() {
    if (transactions.length === 0) {
        const sampleTransactions = [
            {
                id: 'txn_001',
                type: 'received',
                amount: 150,
                description: 'Payment from ABC Corp - Website Development',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'completed'
            },
            {
                id: 'txn_002',
                type: 'withdrawn',
                amount: 50,
                description: 'Withdrawal to Bank Account',
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'completed'
            },
            {
                id: 'txn_003',
                type: 'received',
                amount: 75,
                description: 'Payment from XYZ Ltd - Logo Design',
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'completed'
            }
        ];
        
        transactions = sampleTransactions;
        localStorage.setItem('freelancerTransactions', JSON.stringify(transactions));
        
        if (userCredits === 0) {
            userCredits = 175;
            totalEarnings = 2025;
            pendingCredits = 0;
            
            localStorage.setItem('freelancerVCredits', userCredits.toString());
            localStorage.setItem('totalEarnings', totalEarnings.toString());
            localStorage.setItem('pendingCredits', pendingCredits.toString());
            
            updateDashboard();
        }
    }
}

// Initialize event listeners
function initializeEventListeners() {
    const withdrawCredits = document.getElementById('withdrawCredits');
    const withdrawMethod = document.getElementById('withdrawMethod');
    const withdrawBtn = document.getElementById('withdrawBtn');
    const transactionFilter = document.getElementById('transactionFilter');
    
    if (withdrawCredits) {
        withdrawCredits.addEventListener('input', updateConversionAmount);
    }
    
    if (withdrawMethod) {
        withdrawMethod.addEventListener('change', handleMethodChange);
    }
    
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', handleWithdrawal);
    }
    
    if (transactionFilter) {
        transactionFilter.addEventListener('change', filterTransactions);
    }
    
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', closeSuccessModal);
    }
}

// Update conversion amount
function updateConversionAmount() {
    const credits = parseInt(document.getElementById('withdrawCredits').value) || 0;
    const grossAmount = credits * EXCHANGE_RATE;
    const processingFee = Math.round(grossAmount * PROCESSING_FEE_RATE);
    const netAmount = grossAmount - processingFee;
    
    document.getElementById('conversionAmount').textContent = '₹' + netAmount.toLocaleString();
    
    const withdrawBtn = document.getElementById('withdrawBtn');
    if (credits >= MIN_WITHDRAWAL && credits <= userCredits) {
        withdrawBtn.disabled = false;
    } else {
        withdrawBtn.disabled = true;
    }
}

// Handle withdrawal method change
function handleMethodChange() {
    const method = document.getElementById('withdrawMethod').value;
    const accountDetails = document.getElementById('accountDetails');
    
    if (!method) {
        accountDetails.style.display = 'none';
        return;
    }
    
    let fieldsHTML = '';
    
    switch (method) {
        case 'bank':
            fieldsHTML = `
                <h4>Bank Account Details</h4>
                <div class="form-group">
                    <label>Account Holder Name</label>
                    <input type="text" id="accountHolder" placeholder="Enter account holder name" required>
                </div>
                <div class="form-group">
                    <label>Account Number</label>
                    <input type="text" id="accountNumber" placeholder="Enter account number" required>
                </div>
                <div class="form-group">
                    <label>IFSC Code</label>
                    <input type="text" id="ifscCode" placeholder="Enter IFSC code" required>
                </div>
            `;
            break;
        case 'upi':
            fieldsHTML = `
                <h4>UPI Details</h4>
                <div class="form-group">
                    <label>UPI ID</label>
                    <input type="text" id="upiId" placeholder="Enter UPI ID (e.g., user@paytm)" required>
                </div>
            `;
            break;
        case 'paypal':
            fieldsHTML = `
                <h4>PayPal Details</h4>
                <div class="form-group">
                    <label>PayPal Email</label>
                    <input type="email" id="paypalEmail" placeholder="Enter PayPal email" required>
                </div>
            `;
            break;
        case 'paytm':
            fieldsHTML = `
                <h4>Paytm Details</h4>
                <div class="form-group">
                    <label>Paytm Mobile Number</label>
                    <input type="tel" id="paytmMobile" placeholder="Enter Paytm mobile number" required>
                </div>
            `;
            break;
    }
    
    accountDetails.innerHTML = fieldsHTML;
    accountDetails.style.display = 'block';
}

// Handle withdrawal
function handleWithdrawal() {
    const credits = parseInt(document.getElementById('withdrawCredits').value);
    const method = document.getElementById('withdrawMethod').value;
    
    if (!credits || credits < MIN_WITHDRAWAL || credits > userCredits) {
        alert('Please enter a valid withdrawal amount');
        return;
    }
    
    if (!method) {
        alert('Please select a withdrawal method');
        return;
    }
    
    // Validate method-specific fields
    if (!validateMethodFields(method)) {
        return;
    }
    
    processWithdrawal(credits, method);
}

// Validate method-specific fields
function validateMethodFields(method) {
    switch (method) {
        case 'bank':
            const accountHolder = document.getElementById('accountHolder').value;
            const accountNumber = document.getElementById('accountNumber').value;
            const ifscCode = document.getElementById('ifscCode').value;
            
            if (!accountHolder || !accountNumber || !ifscCode) {
                alert('Please fill in all bank details');
                return false;
            }
            break;
        case 'upi':
            const upiId = document.getElementById('upiId').value;
            if (!upiId) {
                alert('Please enter your UPI ID');
                return false;
            }
            break;
        case 'paypal':
            const paypalEmail = document.getElementById('paypalEmail').value;
            if (!paypalEmail) {
                alert('Please enter your PayPal email');
                return false;
            }
            break;
        case 'paytm':
            const paytmMobile = document.getElementById('paytmMobile').value;
            if (!paytmMobile) {
                alert('Please enter your Paytm mobile number');
                return false;
            }
            break;
    }
    return true;
}

// Process withdrawal
function processWithdrawal(credits, method) {
    const grossAmount = credits * EXCHANGE_RATE;
    const processingFee = Math.round(grossAmount * PROCESSING_FEE_RATE);
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
    
    userCredits -= credits;
    pendingCredits += credits;
    transactions.unshift(transaction);
    
    localStorage.setItem('freelancerVCredits', userCredits.toString());
    localStorage.setItem('pendingCredits', pendingCredits.toString());
    localStorage.setItem('freelancerTransactions', JSON.stringify(transactions));
    
    updateDashboard();
    displayTransactions();
    showSuccessModal(credits, netAmount);
    resetWithdrawalForm();
}

// Show success modal
function showSuccessModal(credits, amount) {
    document.getElementById('successCredits').textContent = credits;
    document.getElementById('successAmount').textContent = '₹' + amount.toLocaleString();
    document.getElementById('successModal').style.display = 'flex';
}

// Close success modal
function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// Reset withdrawal form
function resetWithdrawalForm() {
    document.getElementById('withdrawCredits').value = '';
    document.getElementById('withdrawMethod').value = '';
    document.getElementById('accountDetails').style.display = 'none';
    document.getElementById('conversionAmount').textContent = '₹0';
    document.getElementById('withdrawBtn').disabled = true;
}

// Display transactions
function displayTransactions(filteredTransactions = null) {
    const transactionsList = document.getElementById('transactionsList');
    const transactionsToShow = filteredTransactions || transactions;
    
    if (transactionsToShow.length === 0) {
        transactionsList.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-inbox"></i>
                <p>No transactions found</p>
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
        
        let iconClass, amountClass, amountPrefix;
        
        switch (transaction.type) {
            case 'received':
                iconClass = 'received';
                amountClass = 'positive';
                amountPrefix = '+';
                break;
            case 'withdrawn':
                iconClass = 'withdrawn';
                amountClass = 'negative';
                amountPrefix = '-';
                break;
            default:
                iconClass = 'pending';
                amountClass = 'positive';
                amountPrefix = '+';
        }
        
        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-icon ${iconClass}">
                        <i class="fas fa-${transaction.type === 'received' ? 'arrow-down' : transaction.type === 'withdrawn' ? 'arrow-up' : 'clock'}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${transaction.description}</h4>
                        <p>${formattedDate} at ${formattedTime}</p>
                    </div>
                </div>
                <div class="transaction-amount">
                    <div class="amount ${amountClass}">
                        ${amountPrefix}${transaction.amount} VCreds
                    </div>
                    <div class="status ${transaction.status}">
                        ${transaction.status}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Filter transactions
function filterTransactions() {
    const filterType = document.getElementById('transactionFilter').value;
    
    let filteredTransactions = [...transactions];
    
    if (filterType !== 'all') {
        filteredTransactions = filteredTransactions.filter(transaction => {
            return transaction.type === filterType;
        });
    }
    
    displayTransactions(filteredTransactions);
}

// Simulate receiving credits (for testing)
function simulateReceiveCredits(amount, description) {
    const transaction = {
        id: 'txn_' + Date.now(),
        type: 'received',
        amount: amount,
        description: description,
        date: new Date().toISOString(),
        status: 'completed'
    };
    
    userCredits += amount;
    totalEarnings += amount * EXCHANGE_RATE;
    transactions.unshift(transaction);
    
    localStorage.setItem('freelancerVCredits', userCredits.toString());
    localStorage.setItem('totalEarnings', totalEarnings.toString());
    localStorage.setItem('freelancerTransactions', JSON.stringify(transactions));
    
    updateDashboard();
    displayTransactions();
}