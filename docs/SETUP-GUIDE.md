# 🚀 VCreds System Setup Guide

## Prerequisites

1. **Node.js** (v14 or higher)
2. **PostgreSQL** (v12 or higher)
3. **npm** or **yarn**

## Step 1: Initial Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/skillvault.git
cd skillvault
```

2. **Install dependencies**
```bash
npm install
```

```bash
npm install razorpay
```

## Step 3: Update Database Password

1. Open these files and update the password:
   - `database/create-database.js` (line 8)
   - `database/setup-database.js` (line 8) 
   - `database/test-db-connection.js` (line 6)
   - `server.js` (line 12)
   - `src/api/vcreds-api.js` (line 16)

2. Replace `'yourpassword'` with your actual PostgreSQL password

## Step 4: Create Database and Tables

Run these commands in order:

```bash
# 1. Test connection
node database/test-db-connection.js

# 2. Create skillvault database
node database/create-database.js

# 3. Create tables and schema
node database/setup-database.js
```

## Step 5: Start the Server

```bash
node server.js
```

## Step 6: Test the VCreds System

Open these URLs in your browser:

- **User Dashboard**: http://localhost:3000/dashboard
- **Company Dashboard**: http://localhost:3000/company-dashboard
- **Main Site**: http://localhost:3000

## 🔧 Troubleshooting

### PostgreSQL Service Not Running
1. Press `Win + R`, type `services.msc`
2. Look for "postgresql-x64-xx" service
3. Right-click → Start

### Connection Issues
- Check if PostgreSQL is running on port 5432
- Verify your password is correct
- Make sure Windows Firewall isn't blocking the connection

### Database Issues
- Use pgAdmin (if installed) to visually manage your database
- Check if the skillvault database exists
- Verify tables are created properly

## 📊 Sample Data

The setup script creates test accounts:
- **Company**: company@test.com (500 VCreds)
- **Freelancer**: freelancer@test.com (100 VCreds)

## 🎯 Features Ready to Test

### For Companies:
✅ Purchase VCreds with Razorpay  
✅ Multiple package options  
✅ Custom amount purchases  
✅ Transfer credits to freelancers  

### For Freelancers:
✅ View credit balance  
✅ Withdraw credits to bank/UPI  
✅ Transaction history  
✅ Real-time updates  

## 🔐 Razorpay Configuration

The system uses Razorpay test credentials:
- **Key ID**: rzp_test_RM63ZT0AQ0JWv7
- **Key Secret**: fB3zeaS0xwRHkkMcT5k5V0sG

For production, replace with your live credentials.

## 📱 Next Steps

1. Test the complete flow:
   - Company purchases credits
   - Company transfers to freelancer
   - Freelancer withdraws money

2. Customize the UI/branding
3. Add email notifications
4. Implement user authentication
5. Add admin panel for withdrawal approvals

---

**Need help?** Check the console logs for detailed error messages!