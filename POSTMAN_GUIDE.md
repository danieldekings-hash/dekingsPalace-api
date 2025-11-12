# Postman Collection Guide

## 📦 Files Created

1. **DeKingsPalace.postman_collection.json** - API endpoints collection
2. **DeKingsPalace.postman_environment.json** - Environment variables

## 🚀 How to Import

### Step 1: Import Collection
1. Open Postman
2. Click **Import** button (top left)
3. Select `DeKingsPalace.postman_collection.json`
4. Click **Import**

### Step 2: Import Environment
1. Click **Import** again
2. Select `DeKingsPalace.postman_environment.json`
3. Click **Import**

### Step 3: Activate Environment
1. Click the environment dropdown (top right)
2. Select **DeKingsPalace - Local**

## 📋 Collection Structure

### 1. Authentication (8 requests)
- **Register User** - Create investor account
- **Verify Email** - Verify email with OTP
- **Resend OTP** - Resend verification code
- **Login User** - Get JWT token
- **Register Admin** - Create admin account
- **Refresh Token** - Refresh JWT token
- **Logout** - Logout user
- **Forgot Password** - Request password reset
- **Reset Password** - Reset password with token

### 2. Investments (8 requests)
- **Create Investment - Gold Plan** - Gold plan investment
- **Create Investment - Platinum Plan** - Platinum plan investment
- **Create Investment - Bronze Plan** - Bronze plan investment
- **Create Investment - Silver Plan** - Silver plan investment
- **Create Investment - Diamond Plan** - Diamond plan investment
- **List Investments** - List all investments with filters
- **Get Investment by ID** - Get specific investment details
- **Patch Investment** - Pause/resume investment
- **Investments Summary** - Get aggregate investment statistics
- **Export Investments** - Export investments as CSV/XLSX

### 3. Plans (2 requests)
- **List Active Plans** - Get all active investment plans
- **Create Plan (Admin)** - Create new investment plan (admin only)

### 4. Wallet (4 requests)
- **Get Wallet** - Get wallet details
- **Get Addresses** - Get crypto deposit addresses
- **Create Deposit** - Deposit funds to wallet
- **Request Withdrawal** - Request wallet withdrawal

### 5. Transactions (3 requests)
- **List Transactions** - List all transactions
- **Export CSV** - Export transactions as CSV
- **Get Transaction by ID** - Get specific transaction details

### 6. Referrals (3 requests)
- **Referral Info** - Get referral summary and code
- **Referral List** - List referred users
- **Referral Earnings** - List referral earnings

### 7. Earnings (7 requests)
- **Get Earnings Summary** - Get aggregate earnings statistics
- **List Earnings - All** - List all earnings with filters
- **List Earnings - Investment Only** - List only investment earnings
- **List Earnings - Referral Bonuses Only** - List only referral bonuses
- **List Earnings - Withdrawn Only** - List withdrawn earnings
- **List Earnings - Available for Withdrawal** - List earnings ready to withdraw
- **Withdraw Earnings** - Request earnings withdrawal

### 8. Webhooks (2 requests)
- **Payment Confirmation - Success** - Simulate successful payment
- **Payment Confirmation - Failed** - Simulate failed payment

### 9. Health Check (1 request)
- **Root Endpoint** - Check API status

## 🔄 Testing Workflow

### Complete Flow Test

1. **Register a User**
   - Run: `Authentication > Register User`
   - ✅ Auto-saves token to `auth_token` variable
   - ✅ Auto-saves email to `user_email` variable

2. **Login** (optional, if you already registered)
   - Run: `Authentication > Login User`
   - ✅ Updates `auth_token` variable

3. **Create Investment**
   - Run: `Investments > Create Investment - BTC`
   - ✅ Auto-saves `investment_id`
   - ✅ Auto-saves `payment_reference`
   - ✅ Auto-saves `deposit_address`

4. **Confirm Payment**
   - Run: `Webhooks > Payment Confirmation - Success`
   - Uses the saved `payment_reference` automatically
   - This activates the investment

## 🔑 Environment Variables

The collection automatically manages these variables:

| Variable | Description | Auto-Set |
|----------|-------------|----------|
| `base_url` | API base URL | Manual |
| `auth_token` | JWT token for authentication | ✅ Auto |
| `admin_token` | Admin JWT token | ✅ Auto |
| `user_email` | Registered user email | ✅ Auto |
| `investment_id` | Created investment ID | ✅ Auto |
| `payment_reference` | Payment reference code | ✅ Auto |
| `deposit_address` | Crypto deposit address | ✅ Auto |
| `withdrawal_reference` | Earnings withdrawal reference | ✅ Auto |
| `withdrawal_transaction_id` | Withdrawal transaction ID | ✅ Auto |
| `wallet_balance` | Current wallet balance | ✅ Auto |
| `referral_code` | User's referral code | ✅ Auto |

## 📝 Request Examples

### Register User
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "role": "investor"
}
```

**Response:**
```json
{
  "status": 201,
  "message": "User registered",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login User
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Create Investment
```json
{
  "plan": "Gold Plan",
  "amount": 1000,
  "currency": "BTC"
}
```

**Response:**
```json
{
  "investmentId": "67890abcdef12345",
  "reference": "inv_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "depositAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "message": "Send funds to complete investment"
}
```

### Payment Webhook
```json
{
  "reference": "inv_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "txHash": "0x1234567890abcdef...",
  "confirmations": 6,
  "status": "confirmed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "transactionStatus": "confirmed"
}
```

### Get Earnings Summary
```http
GET /api/earnings/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": 200,
  "data": {
    "totalEarnings": 500.00,
    "totalWithdrawn": 100.00,
    "totalAvailable": 400.00,
    "investmentEarnings": 300.00,
    "referralBonuses": 200.00,
    "withdrawableAmount": 250.00,
    "pendingAmount": 150.00
  }
}
```

### List Earnings
```http
GET /api/earnings?type=all&page=1&pageSize=20&sortBy=date&sortOrder=desc
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": 200,
  "data": {
    "earnings": [
      {
        "id": "earning_id_123",
        "type": "investment_earning",
        "amount": 50.00,
        "date": "2024-01-15T00:00:00.000Z",
        "withdrawableDate": "2024-02-15T00:00:00.000Z",
        "isWithdrawn": false,
        "investment": {
          "plan": "gold",
          "amount": 500
        }
      },
      {
        "id": "earning_id_456",
        "type": "referral_bonus",
        "amount": 15.00,
        "date": "2024-01-20T00:00:00.000Z",
        "withdrawableDate": "2024-02-20T00:00:00.000Z",
        "isWithdrawn": false,
        "referredUser": {
          "fullName": "Jane Doe",
          "email": "jane@example.com"
        },
        "referralTier": "Gold",
        "referralPercentage": 3
      }
    ],
    "meta": {
      "total": 25,
      "page": 1,
      "pageSize": 20,
      "totalPages": 2
    }
  }
}
```

### Withdraw Earnings
```json
{
  "amount": 100.00,
  "currency": "USDT",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**
```json
{
  "status": 201,
  "message": "Withdrawal request created successfully. It will be processed by admin manually.",
  "data": {
    "reference": "earn_with_a1b2c3d4-e5f6-7890",
    "transactionId": "transaction_id_123",
    "message": "Withdrawal request created successfully. It will be processed by admin manually."
  }
}
```

**Note:** Earnings can only be withdrawn after complete 30 days from the earning date. Withdrawals are processed manually by admin.

## 🎯 Quick Test Scenarios

### Scenario 1: New User Investment
1. Register User
2. Create Investment - BTC
3. Payment Confirmation - Success

### Scenario 2: Existing User Login
1. Login User
2. Create Investment - ETH
3. Payment Confirmation - Success

### Scenario 3: Failed Payment
1. Login User
2. Create Investment - USDT
3. Payment Confirmation - Failed

### Scenario 4: Earnings and Withdrawal
1. Login User
2. Create Investment - Gold Plan (to generate earnings)
3. Get Earnings Summary (view total earnings)
4. List Earnings - All (view all earnings including referral bonuses)
5. List Earnings - Available for Withdrawal (check withdrawable earnings)
6. Withdraw Earnings (request withdrawal - requires 30 days wait)

## 🔧 Customization

### Change Base URL
1. Click environment dropdown
2. Select **DeKingsPalace - Local**
3. Edit `base_url` value
4. Save

### Manual Token Entry
If auto-save fails:
1. Copy token from response
2. Go to environment variables
3. Paste into `auth_token`
4. Save

## 🐛 Troubleshooting

### "Unauthorized" Error
- Ensure you've logged in or registered
- Check that `auth_token` is set in environment
- Token expires after 1 day - login again

### "Cannot find module" Error
- Make sure server is running (`npm run dev`)
- Check `base_url` is correct

### Variables Not Auto-Saving
- Check the **Tests** tab in each request
- Ensure environment is selected (top right)

## 📊 Expected Status Codes

| Endpoint | Success Code | Error Codes |
|----------|--------------|-------------|
| Register | 201 | 400 (email exists) |
| Login | 200 | 401 (invalid), 404 (not found) |
| Create Investment | 201 | 401 (unauthorized), 400 (insufficient balance) |
| Get Earnings Summary | 200 | 401 (unauthorized) |
| List Earnings | 200 | 401 (unauthorized), 400 (invalid query) |
| Withdraw Earnings | 201 | 401 (unauthorized), 400 (no withdrawable earnings, insufficient earnings) |
| Webhook | 200 | 500 (processing error) |

## 🎉 Tips

- ✅ Use **Runner** to test entire collection at once
- ✅ Check **Console** (bottom) for detailed request/response
- ✅ Use **Tests** tab to add custom assertions
- ✅ Export environment to share with team
- ✅ Create multiple environments (dev, staging, prod)

## 💰 Earnings & Referral Bonuses

### Referral Bonus System
- **GOLD and below** (Bronze, Silver, Gold): **3%** referral bonus
- **DIAMOND and above** (Platinum, Diamond): **5%** referral bonus

### Earnings Types
1. **Investment Earnings** - Earnings from active investments
2. **Referral Bonuses** - Bonuses earned when referred users make investments

### Withdrawal Rules
- Earnings can only be withdrawn after **complete 30 days** from the earning date
- Withdrawal requests are created with `pending` status
- Admin processes withdrawals manually
- Earnings are reserved (linked to transaction) but not marked as withdrawn until admin processes
- Wallet balance is not deducted until admin processes the withdrawal

### Earnings Endpoints Usage
1. **Get Earnings Summary** - Quick overview of all earnings statistics
2. **List Earnings** - Detailed list with filtering options:
   - Filter by type: `investment_earning`, `referral_bonus`, or `all`
   - Filter by withdrawal status: `isWithdrawn=true` or `isWithdrawn=false`
   - Sort by: `date`, `amount`, or `withdrawableDate`
   - Pagination: `page` and `pageSize`
3. **Withdraw Earnings** - Request withdrawal (requires 30 days wait)

Happy Testing! 🚀
