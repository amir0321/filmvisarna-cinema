import dotenv from "dotenv";
import { app } from "./app.js";
import { config } from "./config.js";
import { initDb } from "./db.js";

dotenv.config();

const PORT = config.port;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(() => {
    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT} (Database offline)`,
      );
    });
  });
