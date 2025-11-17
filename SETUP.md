# Setup Instructions

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create environment file**
   ```bash
   copy .env.example .env
   ```

3. **Configure .env file**
   Edit `.env` and set:
   - `MONGO_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A strong secret key (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `PUBLIC_WALLET` - Your cryptocurrency wallet address
   - `PORT` - Server port (default: 5500)
   - `BSCSCAN_API_KEY` - (Optional) BscScan API key for BEP20 USDT tracking. Get one at https://bscscan.com/apis
   - `SOLANA_RPC_URL` - (Optional) Custom Solana RPC endpoint. Defaults to public mainnet endpoint (no API key required)

4. **Start development server**
   ```bash
   npm run dev
   ```

## Project Files Created

### Configuration
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `.gitignore` - Git ignore rules
- ✅ `.env.example` - Environment variables template
- ✅ `package.json` - Dependencies and scripts

### Source Files

#### Config
- ✅ `src/config/db.ts` - MongoDB connection

#### Models
- ✅ `src/models/User.model.ts` - User schema
- ✅ `src/models/Investment.model.ts` - Investment schema
- ✅ `src/models/Transaction.model.ts` - Transaction schema

#### Routes
- ✅ `src/routes/auth.routes.ts` - Authentication routes
- ✅ `src/routes/investment.routes.ts` - Investment routes
- ✅ `src/routes/webhooks.routes.ts` - Webhook routes

#### Controllers
- ✅ `src/controllers/auth.controller.ts` - Auth handlers
- ✅ `src/controllers/investment.controller.ts` - Investment handlers
- ✅ `src/controllers/webhook.controller.ts` - Webhook handlers

#### Services
- ✅ `src/services/auth.service.ts` - Auth business logic
- ✅ `src/services/investment.service.ts` - Investment business logic
- ✅ `src/services/webhook.service.ts` - Webhook processing

#### Middlewares
- ✅ `src/middlewares/auth.middleware.ts` - JWT authentication & authorization

#### Types
- ✅ `src/types/index.ts` - TypeScript type definitions

#### App Files
- ✅ `src/app.ts` - Express app configuration
- ✅ `src/server.ts` - Server entry point

## API Endpoints

### Authentication (Public)
```
POST /api/auth/register
Body: { name, email, password, role? }

POST /api/auth/login
Body: { email, password }
```

### Investments (Protected - Requires JWT)
```
POST /api/investments
Headers: { Authorization: "Bearer <token>" }
Body: { plan, amount, currency }
```

### Webhooks (Public)
```
POST /api/webhooks/payment
Body: { reference, txHash, confirmations, status }
```

## Testing the API

### 1. Register a User
```bash
curl -X POST http://localhost:5500/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

### 2. Login
```bash
curl -X POST http://localhost:5500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### 3. Create Investment (use token from login)
```bash
curl -X POST http://localhost:5500/api/investments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"plan":"gold","amount":1000,"currency":"BTC"}'
```

## Next Steps

1. **Install dependencies**: Run `npm install`
2. **Setup MongoDB**: Ensure MongoDB is running locally or use MongoDB Atlas
3. **Configure environment**: Copy `.env.example` to `.env` and fill in values
4. **Run the server**: Execute `npm run dev`
5. **Test endpoints**: Use Postman, Thunder Client, or curl

## Production Build

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## Troubleshooting

### Module not found errors
- Run `npm install` to install all dependencies
- Restart your IDE/TypeScript server

### MongoDB connection failed
- Check if MongoDB is running
- Verify `MONGO_URI` in `.env` file
- Ensure network access if using MongoDB Atlas

### JWT errors
- Ensure `JWT_SECRET` is set in `.env`
- Check token format: `Bearer <token>`

## Security Checklist

- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ JWT token authentication
- ✅ Rate limiting (100 req/15min)
- ✅ Helmet security headers
- ✅ CORS enabled
- ✅ Environment variables for secrets
- ⚠️ Add input validation (recommended: express-validator or joi)
- ⚠️ Add request logging for production
- ⚠️ Setup HTTPS in production
