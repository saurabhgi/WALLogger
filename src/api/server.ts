import express, { Express } from "express";
import { createLoggingMiddleware } from "./loggerMiddleware";
import { WALWriter } from "../wal/walWriter";
import { config } from "../config";

async function createServer(): Promise<Express> {
  const app: Express = express();
  app.use(express.json()); //for parsing json request body.

  const walWriter = new WALWriter();
  await walWriter.open()

  app.use(createLoggingMiddleware(walWriter));
  app.get("/api/health", (req, res) => {
    res.send("I am fine, thankyou!");
    // console.log(print)
  });

  app.post("/api/test", (req, res) => {
    // console.log(req)
    const response = {
      ...req.body,
      response: "Test endpoint responding",
    };
    res.json(response);
  });
  return app;
}

async function main() {
  try {
    const app = await createServer();
    const port = 3000;
    app.listen(port, () => {
      console.log(`[Server] Running on http://localhost:${port}`);
      console.log("[Server] Test endpoints:");
      console.log("  POST /api/test");
      console.log("  POST /api/users");
      console.log("  POST /api/products");
      console.log("  GET  /api/health");
    });
  } catch (e) {
    console.log("Error in starting the server", e);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
