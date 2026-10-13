import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { authRouter } from "./routes/auth";

export const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "100kb" }));

const api = express.Router();
api.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Filmvisarna API is running" });
});
api.use("/auth", authRouter);

app.use("/api", api);
