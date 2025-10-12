# 🚀 Skill Vault - VCreds Payment System

A complete credit-based payment system for freelance platforms with Razorpay integration, built with Node.js, PostgreSQL, and modern web technologies.

## ✨ Features

### 💳 For Companies
- **Purchase VCreds** with secure Razorpay payment gateway
- **Multiple packages** (100, 500, 1000 VCreds) with discounts
- **Custom amount** purchases with real-time credit calculation
- **Transfer credits** to freelancers for project payments
- **Transaction history** and balance tracking

### 💰 For Freelancers
- **Credit dashboard** with real-time balance updates
- **Withdrawal system** supporting Bank Transfer, UPI, PayPal, Paytm
- **Transaction history** with detailed payment tracking
- **Exchange rate**: 1 VCred = ₹9 (after 10% platform fee)

### 🔧 Technical Features
- **Razorpay Integration** for secure payments
- **PostgreSQL Database** with comprehensive schema
- **RESTful API** for all credit operations
- **Responsive Design** with modern UI/UX
- **Real-time Updates** and notifications
- **Error Handling** and validation

## 📁 Project Structure

```
SkillVault/
├── src/                 # Main application source
│   ├── pages/          # HTML pages
│   │   ├── userdashboard.html
│   │   ├── companydashboard.html
│   │   ├── login.html
│   │   └── skill-vault-website.html
│   ├── styles/         # CSS files
│   │   ├── login.css
│   │   └── main.css
│   ├── scripts/        # JavaScript files
│   │   └── dashboard/      # Dashboard-specific scripts
│   └── api/            # API endpoints
│       └── vcreds-api.js
├── server/             # Server files
│   └── server.js       # Main Express server
├── database/           # Database files
│   ├── vcreds-schema.sql
│   └── setup-database.js     # Database setup and initialization
├── dev-tools/          # Development utilities
│   ├── debug-server.js      # Development server
│   ├── test-db-connection.js # Database connection tester
│   └── clear-database.js    # Database cleanup utility
├── config/             # Configuration files
│   └── .env
├── docs/               # Documentation
│   └── SETUP-GUIDE.md
├── index.html          # Main landing page
├── .gitignore          # Git ignore rules
├── .env.example        # Environment variables template
├── README.md           # This file
└── package.json        # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/skillvault.git
   cd skillvault
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy environment template
   cp .env.example config/.env
   
   # Edit config/.env with your database credentials and API keys
   ```

4. **Setup database**
   ```bash
   # Setup database and schema
   npm run setup-db
   
   # For development, you can also:
   npm run test-db    # Test database connection
   npm run debug      # Run development server
   npm run clear-db   # Clear database (dev only)
   ```

5. **Start the server**
   ```bash
   # Production mode
   npm start
   
   # Development mode (with debug logging)
   npm run dev
   ```

6. **Access the application**
   - Main site: http://localhost:3000
   - User Dashboard: http://localhost:3000/dashboard
   - Company Dashboard: http://localhost:3000/company-dashboard

## 🔧 Configuration

### Environment Variables
Update `config/.env` with your settings:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skillvault
DB_USER=postgres
DB_PASSWORD=your_password

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Razorpay Setup
1. Create account at [Razorpay](https://razorpay.com)
2. Get your API keys from the dashboard
3. Update the keys in `config/.env` and `src/scripts/config.js`

### Environment Setup
1. Copy `.env.example` to `config/.env`
2. Update all placeholder values with your actual credentials
3. Update `src/scripts/config.js` with your frontend configuration



## 📊 Database Schema

The system uses a comprehensive PostgreSQL schema with the following tables:

- **users** - User accounts (companies, freelancers, admins)
- **user_credits** - Current credit balances
- **credit_orders** - Razorpay purchase orders
- **credit_transactions** - All credit movements
- **withdrawal_requests** - Freelancer withdrawal requests
- **credit_transfers** - Direct transfers between users
- **exchange_rates** - Historical exchange rates
- **projects** - Project/job references

## 🎯 API Endpoints

### Credit Management
- `POST /api/vcreds/create-order` - Create Razorpay order
- `POST /api/vcreds/verify-payment` - Verify payment and add credits
- `POST /api/vcreds/transfer-credits` - Transfer credits between users
- `GET /api/vcreds/balance/:userId` - Get user credit balance
- `GET /api/vcreds/transactions/:userId` - Get transaction history

### Withdrawal System
- `POST /api/vcreds/request-withdrawal` - Request credit withdrawal
- `GET /api/vcreds/withdrawals` - Get withdrawal requests (admin)
- `POST /api/vcreds/process-withdrawal/:id` - Process withdrawal (admin)

## 🧪 Testing

### Test Accounts
The setup creates sample accounts:
- **Company**: company@test.com (500 VCreds)
- **Freelancer**: freelancer@test.com (100 VCreds)

### Razorpay Test Cards
- **Success**: Any card number except 0000 0000 0000 0000
- **Failure**: 0000 0000 0000 0000
- **CVV**: Any 3 digits
- **Expiry**: Any future date

## 🔒 Security Features

- **Payment signature verification** with Razorpay webhooks
- **SQL injection protection** with parameterized queries
- **Input validation** and sanitization
- **Error handling** without exposing sensitive data
- **Transaction integrity** with database transactions

## 🚀 Deployment

### Production Checklist
- [ ] Update Razorpay keys to live credentials
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure environment variables
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [Setup Guide](docs/SETUP-GUIDE.md)
- Review the console logs for error details
- Open an issue on GitHub

## 🙏 Acknowledgments

- [Razorpay](https://razorpay.com) for payment gateway
- [PostgreSQL](https://postgresql.org) for database
- [Express.js](https://expressjs.com) for web framework
- [Font Awesome](https://fontawesome.com) for icons

---

**Made with ❤️ for the freelance community**