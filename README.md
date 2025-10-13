# DeKingsPalace API

Investment platform backend built with Node.js, Express, TypeScript, and MongoDB.

## Features

- 🔐 **Authentication**: JWT-based auth with bcrypt password hashing
- 💰 **Investment Management**: Create and track investments
- 🔄 **Transaction Tracking**: Monitor deposits, withdrawals, and profits
- 🪝 **Webhook Support**: Payment confirmation webhooks
- 🛡️ **Security**: Helmet, CORS, rate limiting
- 📝 **TypeScript**: Full type safety

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt
- **Security**: Helmet, CORS, express-rate-limit

## Project Structure

```
src/
├── config/          # Database and app configuration
├── controllers/     # Request handlers
├── middlewares/     # Auth and custom middlewares
├── models/          # Mongoose schemas
├── routes/          # API route definitions
├── services/        # Business logic
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── jobs/            # Background jobs
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd dekingspalace-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A strong secret key
   - `PUBLIC_WALLET`: Your crypto wallet address
   - `PORT`: Server port (default: 5500)

4. **Run the development server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:5500`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Investments (Protected)
- `POST /api/investments` - Create new investment

### Webhooks
- `POST /api/webhooks/payment` - Payment confirmation webhook

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5500) |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `PUBLIC_WALLET` | Crypto wallet address | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests (to be implemented)

## Security Features

- Password hashing with bcrypt (12 salt rounds)
- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- Helmet for HTTP headers security
- CORS enabled
- Input validation

## Models

### User
- name, email, password
- role: investor | admin
- Timestamps

### Investment
- userId, plan, amount
- status: pending | active | completed | cancelled
- startDate, endDate, returns
- Timestamps

### Transaction
- userId, type (deposit/withdrawal/profit)
- amount, currency, address
- reference, status, txHash, confirmations
- Timestamps

## License

ISC

## Author

DeKingsPalace Team
