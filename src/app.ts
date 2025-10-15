import express from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import connectDB from "./config/db";

// Routes
import authRoutes from "./routes/auth.routes";
import investmentRoutes from "./routes/investment.routes";
import webhookRoutes from "./routes/webhooks.routes";

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(helmet());

// CORS configuration: allow prod domains, local dev, and configurable extra origins
const allowedOrigins: string[] = [
  "https://www.dekingspalace.com",
  "https://dekingspalace.com",
  "http://localhost:3000",
  // Support comma-separated list in ALLOWED_ORIGINS
  ...((process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)),
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (no Origin header)
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin);
    return callback(isAllowed ? null : new Error("Not allowed by CORS"), isAllowed);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};

app.use(cors(corsOptions));
// Ensure preflight requests are handled for all routes
// Use a RegExp to match all paths for OPTIONS so path-to-regexp doesn't parse a '*' token
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/webhooks", webhookRoutes);

app.get("/", (_, res) => res.send("DeKingsPalace API Running 👑"));

export default app;
