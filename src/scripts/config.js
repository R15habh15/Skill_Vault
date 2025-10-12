// Configuration file for client-side settings
const CONFIG = {

    
    // API Endpoints
    API_BASE_URL: window.location.origin,
    
    // Razorpay Configuration (for frontend)
    RAZORPAY_KEY_ID: 'rzp_test_RM63ZT0AQ0JWv7', // Replace with your actual key
    
    // App Settings
    APP_NAME: 'Skill Vault',
    VERSION: '1.0.0'
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}