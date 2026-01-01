// generate-1mb-json.js
import fs from "fs";

const ELEVEN_KB = 1024 * 11;

const payload = {
  requestId: "req-1mb-test",
  timestamp: new Date().toISOString(),
  data: "A".repeat(ELEVEN_KB)
};

fs.writeFileSync(
  "payload-11kb.json",
  JSON.stringify(payload)
);

console.log("Generated payload-1mb.json");
