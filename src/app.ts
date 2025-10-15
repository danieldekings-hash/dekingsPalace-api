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

// CORS configuration: allow local dev and configurable prod origins
const allowedOrigins: string[] = [
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
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/webhooks", webhookRoutes);

app.get("/", (_, res) => res.send("DeKingsPalace API Running 👑"));

export default app;
