import express from "express";
import cors from "cors";
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
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/webhooks", webhookRoutes);

app.get("/", (_, res) => res.send("DeKingsPalace API Running 👑"));

export default app;
