# 🚀 Skill Vault - Freelance Platform with VCreds & Premium Subscriptions

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v14+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v12+-blue.svg)](https://www.postgresql.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A comprehensive freelance marketplace platform with integrated credit system (VCreds), premium subscriptions, job management, real-time chat, and secure Razorpay payment integration.

## 🌟 Star this repo if you find it useful!

## ✨ Key Features

### 💼 For Companies
- **Job Posting & Management** - Post unlimited jobs, manage applications
- **VCreds Purchase** - Buy credits with Razorpay (100, 500, 1000 VCreds packages with discounts)
- **Hire Freelancers** - Review applications, hire talent, manage projects
- **Escrow System** - Secure payment holding and release
- **Real-time Chat** - Direct messaging with freelancers
- **Premium Subscription** - Priority listings, advanced analytics, featured badge
  - Monthly: ₹999 | Quarterly: ₹2,499 | Yearly: ₹8,999

### 👨‍💻 For Freelancers
- **Job Browsing** - Search and filter jobs by category
- **Application System** - Apply with proposals and estimated rates
- **Work Submission** - Submit work files with revision tracking
- **Earnings Dashboard** - Track income and transactions
- **Withdrawal System** - Cash out via Bank Transfer, UPI, PayPal, Paytm
- **Premium Subscription** - Featured profile, reduced fees (5%), priority search
  - Monthly: ₹499 | Quarterly: ₹1,299 | Yearly: ₹4,499

### 🎯 Core Features
- **VCreds System** - Platform currency (1 VCred = ₹10 for companies, ₹9 for freelancers)
- **Premium Subscriptions** - Razorpay-powered monthly/quarterly/yearly plans
- **Real-time Chat** - Socket.io powered messaging system
- **Work Submission & Review** - File upload, review, and revision workflow
- **Escrow Protection** - Secure payment holding until work approval
- **Notifications** - Real-time updates for all activities
- **Responsive Design** - Modern, professional UI across all devices

## 📁 Project Structure

```
Skill_Vault/
├── src/
│   ├── pages/                      # HTML pages
│   │   ├── skill-vault-website.html    # Landing page
│   │   ├── login.html                  # Login page
│   │   ├── register.html               # Registration page
│   │   ├── userdashboard.html          # Freelancer dashboard
│   │   └── companydashboard.html       # Company dashboard
│   ├── styles/                     # CSS files
│   │   ├── main.css                    # Landing page styles
│   │   ├── login.css                   # Login page styles
│   │   ├── register.css                # Register page styles
│   │   └── dashboard.css               # Dashboard styles (professional design)
│   └── scripts/
│       ├── config.js                   # Frontend configuration
│       └── dashboard/                  # Dashboard JavaScript modules
│           ├── auth.js                 # Authentication
│           ├── navigation.js           # Navigation management
│           ├── jobs.js                 # Job browsing
│           ├── applications.js         # Application management
│           ├── active-projects.js      # Project management
│           ├── work-submission.js      # Work submission & review
│           ├── credits.js              # VCreds management (freelancer)
│           ├── company-credits.js      # VCreds management (company)
│           ├── premium-subscription.js # Premium subscription system
│           ├── chat.js                 # Real-time chat
│           └── notifications.js        # Notification system
├── server/
│   ├── server.js                   # Main Express server
│   └── api/
│       ├── work-submission.js          # Work submission API
│       └── premium-subscription.js     # Premium subscription API
├── database/
│   ├── setup-complete-database.js  # Complete database setup (ONE COMMAND)
│   ├── vcreds-schema.sql               # VCreds system schema
│   ├── jobs-schema.sql                 # Jobs & applications schema
│   ├── messages-schema.sql             # Chat system schema
│   ├── projects-schema.sql             # Projects & hired freelancers schema
│   ├── work-submission-schema.sql      # Work submission & escrow schema
│   └── update-premium-schema.sql       # Premium subscription schema
├── uploads/
│   └── work-submissions/           # Uploaded work files
├── .env                            # Environment variables
├── package.json                    # Dependencies
└── README.md                       # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** v14 or higher
- **PostgreSQL** v12 or higher
- **Razorpay Account** (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/skill-vault.git
   cd skill-vault
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Edit .env file with your credentials
   ```

   Required environment variables:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=skillvault
   DB_USER=postgres
   DB_PASSWORD=your_password

   # Razorpay
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret

   # Server
   PORT=3000
   NODE_ENV=development
   ```

4. **Setup database (ONE COMMAND)**
   ```bash
   node database/setup-complete-database.js
   ```
   
   This creates:
   - ✅ skillvault database
   - ✅ 35 tables (users, jobs, messages, projects, subscriptions, etc.)
   - ✅ 6 premium subscription plans
   - ✅ All indexes and constraints

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the application**
   - Landing Page: http://localhost:3000
   - Login: http://localhost:3000/login
   - Register: http://localhost:3000/register
   - Freelancer Dashboard: http://localhost:3000/dashboard
   - Company Dashboard: http://localhost:3000/company-dashboard

## 📊 Database Schema (35 Tables)

### Core System
- **users** - User accounts (freelancers, companies, admins)
- **user_settings** - User preferences
- **user_credits** - VCreds balance tracking
- **notifications** - System notifications

### Credits & Transactions
- **credit_orders** - Razorpay orders for VCreds
- **credit_transactions** - All credit movements
- **credit_transfers** - Direct transfers between users
- **withdrawal_requests** - Freelancer withdrawals
- **exchange_rates** - Historical exchange rates

### Jobs & Applications
- **jobs** - Job postings from companies
- **job_applications** - Freelancer applications

### Company Features
- **company_profiles** - Extended company information

### Projects & Work
- **active_projects** - Ongoing projects
- **hired_freelancers** - Company-freelancer relationships
- **project_milestones** - Project progress tracking
- **project_communications** - Project messages
- **work_submissions** - Submitted work files
- **work_reviews** - Company feedback on submissions
- **escrow_transactions** - Credit holds and releases
- **past_projects** - Completed projects archive

### Chat System
- **messages** - Direct messages between users

### Premium Subscriptions
- **subscription_plans** - Available premium plans (6 plans)
- **user_subscriptions** - Active user subscriptions
- **subscription_transactions** - Subscription payment history

## 🎯 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Jobs
- `POST /api/jobs/post` - Post a job (company)
- `GET /api/jobs/browse` - Browse jobs (freelancer)
- `POST /api/jobs/apply` - Apply to job (freelancer)
- `GET /api/jobs/:jobId/applications` - Get applications (company)
- `PUT /api/jobs/applications/:applicationId/status` - Update application status

### VCreds
- `POST /api/company/create-order` - Create Razorpay order for VCreds
- `POST /api/company/verify-payment` - Verify payment and add credits
- `GET /api/credits/balance/:userId` - Get credit balance
- `GET /api/credits/transactions/:userId` - Get transaction history
- `POST /api/credits/withdraw` - Request withdrawal (freelancer)

### Premium Subscriptions
- `GET /api/premium/plans` - Get subscription plans
- `GET /api/premium/user/:userId` - Get user's subscription
- `POST /api/premium/create-order` - Create subscription order
- `POST /api/premium/verify-payment` - Verify and activate subscription
- `GET /api/premium/history/:userId` - Get subscription history

### Projects
- `GET /api/jobs/projects/user/:userId` - Get user's projects
- `PUT /api/jobs/projects/:projectId/status` - Update project status

### Work Submission
- `POST /api/work-submission/submit` - Submit work (freelancer)
- `GET /api/work-submission/submissions/:projectId` - Get submissions
- `POST /api/work-submission/review` - Review work (company)

### Chat
- `GET /api/chat/conversations/:userId` - Get conversations
- `GET /api/chat/messages/:userId/:contactId` - Get messages
- `POST /api/chat/send` - Send message
- `PUT /api/chat/mark-read/:userId/:contactId` - Mark messages as read

### Notifications
- `GET /api/notifications/:userId` - Get notifications
- `PATCH /api/notifications/:notificationId/read` - Mark as read
- `PATCH /api/notifications/:userId/read-all` - Mark all as read

## 💎 Premium Subscription Plans

### For Companies
| Plan | Duration | Price | Savings |
|------|----------|-------|---------|
| Monthly | 30 days | ₹999 | - |
| Quarterly | 90 days | ₹2,499 | 17% |
| Yearly | 365 days | ₹8,999 | 25% |

**Benefits:**
- Priority job listings (appear first)
- Unlimited job postings
- Advanced analytics dashboard
- Featured company badge
- Priority customer support
- Advanced freelancer search filters
- Detailed project insights

### For Freelancers
| Plan | Duration | Price | Savings |
|------|----------|-------|---------|
| Monthly | 30 days | ₹499 | - |
| Quarterly | 90 days | ₹1,299 | 13% |
| Yearly | 365 days | ₹4,499 | 25% |

**Benefits:**
- Featured profile badge
- Priority in search results
- Reduced platform fees (5% instead of 10%)
- Advanced earnings analytics
- Instant job alerts
- Unlimited job applications
- Access to premium courses

## 🎨 Design System

### Professional CSS Architecture
- **CSS Variables** - Consistent theming
- **Modern Color Palette** - Professional grays, primary colors, status colors
- **Component Library** - Cards, buttons, forms, badges, tables, modals
- **Responsive Design** - Mobile-first approach
- **Smooth Animations** - Fade in, slide up, hover effects
- **Utility Classes** - Quick styling helpers

### Color Palette
- Primary: #667eea (Purple-blue)
- Secondary: #764ba2 (Purple)
- Success: #10b981 (Green)
- Warning: #f59e0b (Orange)
- Error: #ef4444 (Red)
- Info: #3b82f6 (Blue)

## 🔒 Security Features

- **Razorpay Payment Verification** - Signature validation
- **SQL Injection Protection** - Parameterized queries
- **Input Validation** - Server-side validation
- **Password Hashing** - bcrypt with salt rounds
- **Transaction Integrity** - Database transactions
- **File Upload Security** - Type and size validation
- **XSS Protection** - Input sanitization

## 🧪 Testing

### Razorpay Test Mode
- Use test API keys from Razorpay dashboard
- Test cards: Any valid card number (not 0000 0000 0000 0000)
- CVV: Any 3 digits
- Expiry: Any future date

### Test Workflow
1. Register as company and freelancer
2. Company: Purchase VCreds
3. Company: Post a job
4. Freelancer: Browse and apply
5. Company: Accept application (creates project)
6. Freelancer: Submit work
7. Company: Review and approve
8. Test premium subscription purchase
9. Test chat system
10. Test withdrawal request

## 📦 NPM Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm test               # Run tests (if configured)
```

## 🚀 Deployment

### Production Checklist
- [ ] Update Razorpay keys to live mode
- [ ] Configure production database
- [ ] Set NODE_ENV=production
- [ ] Enable SSL/HTTPS
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Configure file upload limits
- [ ] Review security settings

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Socket.io** - Real-time communication
- **Razorpay** - Payment gateway
- **bcrypt** - Password hashing
- **Multer** - File uploads

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **Modern CSS** - CSS Variables, Grid, Flexbox
- **Font Awesome** - Icons
- **Socket.io Client** - Real-time chat

## Contributers
- **Rishabh Tripathi**
- **Abhishekh Yadav**
- **Riya Solanki**

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Razorpay](https://razorpay.com) - Payment gateway
- [PostgreSQL](https://postgresql.org) - Database
- [Express.js](https://expressjs.com) - Web framework
- [Socket.io](https://socket.io) - Real-time engine
- [Font Awesome](https://fontawesome.com) - Icons

---

**Built with ❤️ for the freelance community**
