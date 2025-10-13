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

### 1. Authentication (3 requests)
- **Register User** - Create investor account
- **Login User** - Get JWT token
- **Register Admin** - Create admin account

### 2. Investments (3 requests)
- **Create Investment - BTC** - Bitcoin investment
- **Create Investment - ETH** - Ethereum investment
- **Create Investment - USDT** - USDT investment

### 3. Webhooks (2 requests)
- **Payment Confirmation - Success** - Simulate successful payment
- **Payment Confirmation - Failed** - Simulate failed payment

### 4. Health Check (1 request)
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
| Create Investment | 201 | 401 (unauthorized) |
| Webhook | 200 | 500 (processing error) |

## 🎉 Tips

- ✅ Use **Runner** to test entire collection at once
- ✅ Check **Console** (bottom) for detailed request/response
- ✅ Use **Tests** tab to add custom assertions
- ✅ Export environment to share with team
- ✅ Create multiple environments (dev, staging, prod)

Happy Testing! 🚀
