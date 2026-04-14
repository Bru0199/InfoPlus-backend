/**
 * Server entry point
 * Starts the Express app and listens on PORT
 */

import { app } from "./app.js";
import { env } from "./env.js";
import { logger } from "./utils/logger.js";

const PORT = env.PORT;

app
  .listen(PORT, () => {
    logger.success(`Server running at http://localhost:${PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  })
  .on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      logger.error(`Port ${PORT} is already in use`);
    } else {
      logger.error("Server failed to start", err);
    }
    process.exit(1);
  });
