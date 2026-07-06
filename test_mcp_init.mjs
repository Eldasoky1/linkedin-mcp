import { spawn } from "child_process";

const proc = spawn("node", [
  "dist/index.js"
], {
  cwd: "C:\\Users\\engAh\\OneDrive\\Desktop\\Mcps\\linkedin-mcp",
  env: {
    LINKEDIN_EMAIL: "ahmed.320240024@ejust.edu.eg",
    LINKEDIN_PASSWORD: "01221875193**",
    COOKIES_PATH: "C:\\Users\\engAh\\OneDrive\\Desktop\\Mcps\\linkedin-mcp\\linkedin_cookies.json"
  },
  stdio: ["pipe", "pipe", "pipe"]
});

let stdout = "";
let stderr = "";

proc.stdout.on("data", d => stdout += d.toString());
proc.stderr.on("data", d => stderr += d.toString());

// MCP handshake: initialize -> initialized notification -> tools/list
const init = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1.0" } } }) + "\n";
const initialized = JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }) + "\n";
const listTools = JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }) + "\n";

setTimeout(() => proc.stdin.write(init), 2000);
setTimeout(() => proc.stdin.write(initialized), 4000);
setTimeout(() => proc.stdin.write(listTools), 6000);
setTimeout(() => {
  proc.kill();
  console.log("=== STDERR (server logs) ===");
  console.log(stderr);

  console.log("\n=== STDOUT (JSON-RPC) ===");
  const lines = stdout.trim().split("\n").filter(Boolean);
  for (const line of lines) {
    try {
      const p = JSON.parse(line);
      if (p.id === 1) console.log("INIT RESPONSE:", JSON.stringify(p).substring(0, 300));
      else if (p.id === 2) {
        const tools = p.result?.tools || [];
        console.log(`\n✅ ${tools.length} TOOLS REGISTERED:`);
        tools.forEach(t => console.log(`   ${t.name}`));
      } else if (p.method === "log") console.log("LOG:", p.params?.data?.substring(0, 100));
      else console.log("MSG:", JSON.stringify(p).substring(0, 200));
    } catch { console.log("RAW:", line); }
  }
}, 10000);
