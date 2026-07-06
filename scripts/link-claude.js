import fs from 'fs';
import path from 'path';
import os from 'os';

const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
const claudeDir = path.join(appData, 'Claude');
const claudeConfigPath = path.join(claudeDir, 'claude_desktop_config.json');

const vscodeDir = path.join(appData, 'Code', 'User');
const vscodeConfigPath = path.join(vscodeDir, 'mcp.json');

// Ensure Claude directory exists
if (!fs.existsSync(claudeDir)) {
  fs.mkdirSync(claudeDir, { recursive: true });
}

// Load or initialize configs
const loadConfig = (p) => {
  if (fs.existsSync(p)) {
    try {
      const raw = fs.readFileSync(p, 'utf8');
      return raw.trim() ? JSON.parse(raw) : { mcpServers: {} };
    } catch (e) {
      console.error(`Failed to parse ${p}, starting fresh.`, e.message);
    }
  }
  return { mcpServers: {} };
};

let claudeConfig = loadConfig(claudeConfigPath);
let vscodeConfig = loadConfig(vscodeConfigPath);
if (!claudeConfig.mcpServers) claudeConfig.mcpServers = {};
if (!vscodeConfig.mcpServers) vscodeConfig.mcpServers = {};

// Format absolute paths
const projectDir = process.cwd();
const entryPath = path.join(projectDir, "dist", "index.js");
const cookiesPath = path.join(projectDir, "linkedin_cookies.json");

// Preserve existing credentials if they exist
const existingClaudeEnv = claudeConfig.mcpServers['linkedin']?.env || {};
const existingVscodeEnv = vscodeConfig.mcpServers['linkedin']?.env || {};

const email = existingClaudeEnv.LINKEDIN_EMAIL || existingVscodeEnv.LINKEDIN_EMAIL || "your_email@example.com";
const password = existingClaudeEnv.LINKEDIN_PASSWORD || existingVscodeEnv.LINKEDIN_PASSWORD || "your_password";

// Build MCP Config definition
const serverDef = {
  command: "C:\\Program Files\\nodejs\\node.exe",
  args: [entryPath],
  env: {
    LINKEDIN_EMAIL: email,
    LINKEDIN_PASSWORD: password,
    COOKIES_PATH: cookiesPath
  }
};

claudeConfig.mcpServers['linkedin'] = serverDef;
vscodeConfig.mcpServers['linkedin'] = serverDef;

fs.writeFileSync(claudeConfigPath, JSON.stringify(claudeConfig, null, 2));
fs.writeFileSync(vscodeConfigPath, JSON.stringify(vscodeConfig, null, 2));

console.log(`\n✅ Linked 'linkedin' MCP server to Claude Desktop and VS Code.`);
console.log(`📂 Claude Config: ${claudeConfigPath}`);
console.log(`📂 VS Code Config: ${vscodeConfigPath}`);
console.log(`\n⚠️ NEXT ACTION REQUIRED:`);
console.log(`Open the config file above and replace 'your_email@example.com' and 'your_password' with your actual LinkedIn credentials before restarting Claude Desktop.\n`);
