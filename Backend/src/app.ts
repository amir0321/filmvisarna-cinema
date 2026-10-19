import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { ZodError } from "zod";
import { config } from "./config.js";
import { authRouter } from "./routes/auth";
import { screeningsRouter } from "./routes/screenings.js";
import { moviesRouter } from "./routes/movies";
import { HttpError } from "./utils/httpErorr";
import { bookingsRouter } from "./routes/bookings.js";
import { kioskRouter } from "./routes/kiosk.routes.js";
import { cinemasRouter } from "./routes/cinemas.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "100kb" }));

const api = express.Router();
api.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Filmvisarna API is running" });
});
api.use("/auth", authRouter);
api.use("/screenings", screeningsRouter);
api.use("/movies", moviesRouter);
api.use("/bookings", bookingsRouter);
api.use("/kiosk", kioskRouter);
api.use("/cinemas", cinemasRouter);

app.use("/api", api);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Sidan hittades inte" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ success: false, error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );
    res.status(400).json({ success: false, error: "Valideringsfel", details });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internt serverfel" });
});
