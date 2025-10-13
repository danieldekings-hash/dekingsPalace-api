# Registration System Update

## ✅ Changes Made

### 1. User Model Updated (`src/models/User.model.ts`)

**New Fields:**
- `fullName` - User's full name (required)
- `email` - Email address (required, unique, lowercase)
- `phoneNumber` - Phone number (required, unique)
- `password` - Hashed password (required)
- `referralCode` - Unique 8-character code (auto-generated)
- `referredBy` - Referral code of the person who referred them (optional)
- `role` - User role: "investor" or "admin" (default: "investor")

**Removed Fields:**
- `name` (replaced with `fullName`)

### 2. Registration DTO Updated (`src/types/index.ts`)

**Required Fields:**
- `fullName` - Full name
- `email` - Email address
- `phoneNumber` - Phone number
- `password` - Password
- `confirmPassword` - Password confirmation

**Optional Fields:**
- `referralCode` - Referral code from another user
- `role` - User role (defaults to "investor")

### 3. Registration Logic Enhanced (`src/services/auth.service.ts`)

**Validations Added:**
- ✅ Password and confirmPassword must match
- ✅ Email uniqueness check
- ✅ Phone number uniqueness check
- ✅ Referral code validation (if provided)

**Features:**
- Auto-generates unique 8-character referral code for each user
- Tracks referrer if referral code is provided
- Returns user's referral code in response

### 4. Referral Utilities (`src/utils/referral.util.ts`)

**Functions:**
- `generateReferralLink()` - Creates full referral URL
- `isValidReferralCode()` - Validates referral code format

### 5. Postman Collection Updated

**Registration Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+1234567890",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  "referralCode": "",
  "role": "investor"
}
```

## 📋 API Usage

### Register New User

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "phoneNumber": "+1234567890",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "referralCode": "ABC12345"
}
```

**Success Response (201):**
```json
{
  "status": 201,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "referralCode": "XYZ98765"
}
```

**Error Responses:**

**400 - Passwords Don't Match:**
```json
{
  "status": 400,
  "message": "Passwords do not match"
}
```

**400 - Email Already Exists:**
```json
{
  "status": 400,
  "message": "Email already registered"
}
```

**400 - Phone Already Exists:**
```json
{
  "status": 400,
  "message": "Phone number already registered"
}
```

**400 - Invalid Referral Code:**
```json
{
  "status": 400,
  "message": "Invalid referral code"
}
```

## 🔗 Referral System

### How It Works

1. **User Registers** → Gets unique referral code (e.g., `ABC12345`)
2. **User Shares Link** → `http://yoursite.com/register?ref=ABC12345`
3. **New User Registers** → Enters `ABC12345` in referralCode field
4. **System Validates** → Checks if referral code exists
5. **Link Created** → New user's `referredBy` field set to `ABC12345`

### Generate Referral Link

```typescript
import { generateReferralLink } from "./utils/referral.util";

const referralLink = generateReferralLink("ABC12345");
// Returns: http://localhost:3000/register?ref=ABC12345
```

### Validate Referral Code

```typescript
import { isValidReferralCode } from "./utils/referral.util";

isValidReferralCode("ABC12345"); // true
isValidReferralCode("abc123");   // false (must be 8 chars)
isValidReferralCode("ABCD1234"); // true
```

## 🗄️ Database Schema

```javascript
{
  fullName: "John Doe",
  email: "john@example.com",
  phoneNumber: "+1234567890",
  password: "$2b$12$...", // hashed
  role: "investor",
  referralCode: "ABC12345", // unique, auto-generated
  referredBy: "XYZ98765",   // optional, from referrer
  createdAt: "2025-10-13T10:00:00.000Z",
  updatedAt: "2025-10-13T10:00:00.000Z"
}
```

## 🔐 Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Password confirmation validation
- ✅ Email uniqueness enforcement
- ✅ Phone number uniqueness enforcement
- ✅ Referral code validation
- ✅ Lowercase email normalization
- ✅ Email trimming

## 📝 Environment Variables

Add to your `.env` file:

```env
FRONTEND_URL=http://localhost:3000
```

This is used to generate referral links.

## 🧪 Testing with Postman

### Test 1: Register Without Referral
```json
{
  "fullName": "Test User",
  "email": "test@example.com",
  "phoneNumber": "+1111111111",
  "password": "Test123!",
  "confirmPassword": "Test123!"
}
```

### Test 2: Register With Referral
First, get a referral code from Test 1 response, then:
```json
{
  "fullName": "Referred User",
  "email": "referred@example.com",
  "phoneNumber": "+2222222222",
  "password": "Test123!",
  "confirmPassword": "Test123!",
  "referralCode": "ABC12345"
}
```

### Test 3: Password Mismatch
```json
{
  "fullName": "Test User",
  "email": "test2@example.com",
  "phoneNumber": "+3333333333",
  "password": "Test123!",
  "confirmPassword": "Different123!"
}
```
Expected: 400 error

### Test 4: Invalid Referral Code
```json
{
  "fullName": "Test User",
  "email": "test3@example.com",
  "phoneNumber": "+4444444444",
  "password": "Test123!",
  "confirmPassword": "Test123!",
  "referralCode": "INVALID1"
}
```
Expected: 400 error

## 🚀 Next Steps

1. ✅ Update frontend registration form
2. ✅ Add referral tracking dashboard
3. ✅ Implement referral rewards system
4. ✅ Add phone number verification (SMS)
5. ✅ Add email verification
6. ✅ Create referral analytics endpoint

## 📊 Future Enhancements

- Track referral conversions
- Referral rewards/bonuses
- Multi-level referral system
- Referral leaderboard
- Phone number verification via SMS
- Email verification
- Social media sharing for referral links
