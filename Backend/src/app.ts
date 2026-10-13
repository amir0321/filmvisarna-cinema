import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config";
import { pool } from "./db";
import { authRouter } from "./routes/auth";

export const app = express();
app.use(helmet());
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const api = express.Router();

api.get("/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok" });
});

api.use("/api/auth", authRouter);
