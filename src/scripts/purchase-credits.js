// Razorpay Configuration - Load from config
const RAZORPAY_KEY_ID = CONFIG.RAZORPAY_KEY_ID;

// Global variables
let selectedPackage = null;
let customAmount = 0;
let customCredits = 0;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('Initializing purchase credits page...');
        initializePackageSelection();
        initializeCustomAmount();
        initializePaymentFlow();
        console.log('Purchase credits page initialized successfully');
    } catch (error) {
        console.error('Error initializing page:', error);
        alert(`Page initialization failed: ${error.message || error}`);
    }
});

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
    console.error('Error message:', event.message);
    console.error('Error filename:', event.filename);
    console.error('Error line:', event.lineno);
    console.error('Error column:', event.colno);
    
    const errorDetails = `
        Error: ${event.message}
        File: ${event.filename}
        Line: ${event.lineno}:${event.colno}
        Stack: ${event.error ? event.error.stack : 'No stack trace'}
    `;
    
    alert(`JavaScript Error Detected:\n${errorDetails}`);
});

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    alert(`Promise Rejection: ${event.reason}`);
});

// Package Selection
function initializePackageSelection() {
    try {
        console.log('Initializing package selection...');
        const packageCards = document.querySelectorAll('.package-card');
        const selectButtons = document.querySelectorAll('.select-package-btn');

        console.log(`Found ${packageCards.length} package cards and ${selectButtons.length} select buttons`);

        selectButtons.forEach((button, index) => {
            button.addEventListener('click', function() {
                try {
                    const card = packageCards[index];
                    const amount = parseInt(card.dataset.amount);
                    const credits = parseInt(card.dataset.credits);
                    
                    console.log(`Package selected: ${credits} credits for ₹${amount}`);
                    selectPackage(amount, credits, card);
                } catch (error) {
                    console.error('Error in package selection:', error);
                    alert(`Package selection error: ${error.message}`);
                }
            });
        });
        
        console.log('Package selection initialized successfully');
    } catch (error) {
        console.error('Error initializing package selection:', error);
        alert(`Package selection initialization failed: ${error.message}`);
    }
}

// Custom Amount Handling
function initializeCustomAmount() {
    const customAmountInput = document.getElementById('customAmount');
    const creditsDisplay = document.getElementById('creditsAmount');
    const customPurchaseBtn = document.getElementById('customPurchaseBtn');

    customAmountInput.addEventListener('input', function() {
        const amount = parseFloat(this.value) || 0;
        const credits = Math.floor(amount / 10); // 1 VCred = ₹10
        
        creditsDisplay.textContent = credits;
        customAmount = amount;
        customCredits = credits;
        
        // Enable/disable button based on minimum amount
        if (amount >= 100) {
            customPurchaseBtn.disabled = false;
            customPurchaseBtn.style.opacity = '1';
        } else {
            customPurchaseBtn.disabled = true;
            customPurchaseBtn.style.opacity = '0.5';
        }
    });

    customPurchaseBtn.addEventListener('click', function() {
        if (customAmount >= 100) {
            selectPackage(customAmount, customCredits, null, true);
        }
    });
}

// Select Package Function
function selectPackage(amount, credits, cardElement = null, isCustom = false) {
    selectedPackage = {
        amount: amount,
        credits: credits,
        isCustom: isCustom
    };

    // Visual feedback for package selection
    if (cardElement && !isCustom) {
        document.querySelectorAll('.package-card').forEach(card => {
            card.classList.remove('selected');
        });
        cardElement.classList.add('selected');
    }

    // Show payment summary
    showPaymentSummary(amount, credits);
    
    // Scroll to payment summary
    document.getElementById('paymentSummary').scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
    });
}

// Show Payment Summary
function showPaymentSummary(amount, credits) {
    const processingFee = Math.round(amount * 0.02); // 2% processing fee
    const total = amount + processingFee;

    document.getElementById('summaryCredits').textContent = credits + ' VCreds';
    document.getElementById('summaryAmount').textContent = '₹' + amount.toLocaleString();
    document.getElementById('summaryFee').textContent = '₹' + processingFee.toLocaleString();
    document.getElementById('summaryTotal').textContent = '₹' + total.toLocaleString();
    
    document.getElementById('paymentSummary').style.display = 'block';
}

// Payment Flow
function initializePaymentFlow() {
    const proceedButton = document.getElementById('proceedPayment');
    
    proceedButton.addEventListener('click', function() {
        if (selectedPackage) {
            initiateRazorpayPayment();
        }
    });
}

// Razorpay Payment Integration
function initiateRazorpayPayment() {
    if (!selectedPackage) {
        alert('Please select a package first');
        return;
    }

    // Check if Razorpay is loaded
    if (typeof Razorpay === 'undefined') {
        alert('Payment system is loading. Please try again in a moment.');
        return;
    }

    const processingFee = Math.round(selectedPackage.amount * 0.02);
    const totalAmount = selectedPackage.amount + processingFee;
    
    // Show loading
    showLoading(true);

    // Create order on server (simulate with timeout)
    setTimeout(() => {
        createRazorpayOrder(totalAmount);
    }, 1000);
}

// Create Razorpay Order
function createRazorpayOrder(amount) {
    try {
        // Create order data for Razorpay
        const orderData = {
            id: 'order_' + Date.now(),
            amount: amount * 100, // Razorpay expects amount in paise
            currency: 'INR',
            receipt: 'receipt_' + Date.now()
        };

        console.log('Creating Razorpay order:', orderData);
        openRazorpayCheckout(orderData);
        
    } catch (error) {
        console.error('Error creating order:', error);
        showLoading(false);
        alert('Failed to create payment order: ' + error.message);
    }
}

// Open Razorpay Checkout
function openRazorpayCheckout(orderData) {
    showLoading(false);
    
    // Check if Razorpay is available
    if (typeof Razorpay === 'undefined') {
        console.error('Razorpay not loaded');
        alert('Payment system not available. Please refresh the page and try again.');
        return;
    }
    
    try {
        console.log('Opening Razorpay checkout with options...');
        
        const options = {
            key: RAZORPAY_KEY_ID,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'Skill Vault',
            description: `Purchase ${selectedPackage.credits} VCreds`,
            image: 'https://via.placeholder.com/100x100/667eea/ffffff?text=SV',
            handler: function(response) {
                console.log('Payment successful:', response);
                handlePaymentSuccess(response);
            },
            prefill: {
                name: 'Company User',
                email: 'company@example.com',
                contact: '9999999999'
            },
            notes: {
                credits: selectedPackage.credits,
                package_type: selectedPackage.isCustom ? 'custom' : 'predefined'
            },
            theme: {
                color: '#667eea'
            },
            modal: {
                ondismiss: function() {
                    showLoading(false);
                    console.log('Payment cancelled by user');
                }
            }
        };
        
        console.log('Razorpay options:', options);
        
        const rzp = new Razorpay(options);
        
        rzp.on('payment.failed', function(response) {
            console.error('Payment failed:', response.error);
            handlePaymentFailure(response.error);
        });
        
        console.log('Opening Razorpay modal...');
        rzp.open();
        
    } catch (error) {
        console.error('Error opening Razorpay:', error);
        alert('Failed to open payment gateway: ' + error.message);
        showLoading(false);
    }
}

// Handle Payment Success
function handlePaymentSuccess(response) {
    console.log('Payment successful:', response);
    
    // Show loading while processing
    showLoading(true, 'Processing your purchase...');
    
    // Simulate server-side processing
    setTimeout(() => {
        // Update user's credit balance (this would be done server-side)
        updateUserCredits(selectedPackage.credits);
        
        // Show success modal
        showSuccessModal(response.razorpay_payment_id);
        
        showLoading(false);
    }, 2000);
}

// Handle Payment Failure
function handlePaymentFailure(error) {
    console.error('Payment failed:', error);
    showLoading(false);
    
    // Show detailed error information
    let errorMessage = 'Payment failed: ';
    if (error) {
        if (error.description) {
            errorMessage += error.description;
        } else if (error.message) {
            errorMessage += error.message;
        } else if (typeof error === 'string') {
            errorMessage += error;
        } else {
            errorMessage += JSON.stringify(error);
        }
        
        console.error('Full error object:', error);
        console.error('Error type:', typeof error);
        console.error('Error keys:', Object.keys(error || {}));
    } else {
        errorMessage += 'Unknown error occurred';
    }
    
    alert(errorMessage);
}

// Update User Credits (simulate)
function updateUserCredits(credits) {
    // In a real application, this would be an API call to update the database
    console.log(`Adding ${credits} VCreds to user account`);
    
    // Store in localStorage for demo purposes
    const currentCredits = parseInt(localStorage.getItem('userVCredits') || '0');
    const newBalance = currentCredits + credits;
    localStorage.setItem('userVCredits', newBalance.toString());
    
    // Log transaction
    const transaction = {
        id: 'txn_' + Date.now(),
        type: 'purchase',
        credits: credits,
        amount: selectedPackage.amount,
        timestamp: new Date().toISOString()
    };
    
    const transactions = JSON.parse(localStorage.getItem('creditTransactions') || '[]');
    transactions.push(transaction);
    localStorage.setItem('creditTransactions', JSON.stringify(transactions));
}

// Show Success Modal
function showSuccessModal(transactionId) {
    document.getElementById('successCredits').textContent = selectedPackage.credits;
    document.getElementById('successTxnId').textContent = transactionId;
    document.getElementById('successModal').style.display = 'flex';
    
    // Close modal handler
    document.getElementById('closeModal').onclick = function() {
        document.getElementById('successModal').style.display = 'none';
        resetForm();
    };
}

// Show/Hide Loading
function showLoading(show, message = 'Processing your payment...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = overlay.querySelector('p');
    
    if (show) {
        loadingText.textContent = message;
        overlay.style.display = 'flex';
    } else {
        overlay.style.display = 'none';
    }
}

// Reset Form
function resetForm() {
    selectedPackage = null;
    customAmount = 0;
    customCredits = 0;
    
    // Reset UI
    document.querySelectorAll('.package-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    document.getElementById('customAmount').value = '';
    document.getElementById('creditsAmount').textContent = '0';
    document.getElementById('customPurchaseBtn').disabled = true;
    document.getElementById('paymentSummary').style.display = 'none';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function formatNumber(number) {
    return new Intl.NumberFormat('en-IN').format(number);
}

// Add selected state CSS dynamically
const style = document.createElement('style');
style.textContent = `
    .package-card.selected {
        border-color: #667eea !important;
        box-shadow: 0 20px 60px rgba(102,126,234,0.3) !important;
        transform: translateY(-10px) scale(1.02) !important;
    }
    
    .package-card.selected::before {
        opacity: 0.1 !important;
    }
`;
document.head.appendChild(style);

// Check Razorpay loading status
setTimeout(() => {
    if (typeof Razorpay !== 'undefined') {
        console.log('✅ Razorpay loaded successfully');
    } else {
        console.error('❌ Razorpay failed to load');
    }
}, 2000);