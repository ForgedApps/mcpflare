/**
 * Configuration Loader
 * 
 * Loads MCP configurations from various IDE config files
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { MCPServerInfo } from './types';

/**
 * IDE configuration file locations
 */
const IDE_CONFIG_PATHS = {
  claude: [
    // Claude Code on Windows
    path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json'),
    // Claude Code on macOS
    path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
    // Claude Code on Linux
    path.join(os.homedir(), '.config', 'claude', 'claude_desktop_config.json'),
  ],
  copilot: [
    // GitHub Copilot MCP config
    path.join(os.homedir(), '.github-copilot', 'apps.json'),
  ],
  cursor: [
    // Cursor MCP config
    path.join(os.homedir(), '.cursor', 'User', 'globalStorage', 'mcp.json'),
  ],
};

/**
 * Check if a file exists and is readable
 */
function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely parse JSON from a file
 */
function safeParseJSON(filePath: string): unknown | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Load MCPs from Claude Desktop config
 */
function loadClaudeConfig(): MCPServerInfo[] {
  const mcps: MCPServerInfo[] = [];
  
  for (const configPath of IDE_CONFIG_PATHS.claude) {
    if (!fileExists(configPath)) continue;
    
    const config = safeParseJSON(configPath) as {
      mcpServers?: Record<string, {
        command?: string;
        args?: string[];
        url?: string;
        env?: Record<string, string>;
        disabled?: boolean;
      }>;
    } | null;
    
    if (!config?.mcpServers) continue;
    
    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      // Skip mcpguard itself
      if (name === 'mcpguard') continue;
      
      mcps.push({
        name,
        command: serverConfig.command,
        args: serverConfig.args,
        url: serverConfig.url,
        env: serverConfig.env,
        source: 'claude',
        enabled: !serverConfig.disabled,
      });
    }
    
    // Only use first found config
    break;
  }
  
  return mcps;
}

/**
 * Load MCPs from GitHub Copilot config
 */
function loadCopilotConfig(): MCPServerInfo[] {
  const mcps: MCPServerInfo[] = [];
  
  for (const configPath of IDE_CONFIG_PATHS.copilot) {
    if (!fileExists(configPath)) continue;
    
    const config = safeParseJSON(configPath) as {
      mcpServers?: Record<string, {
        command?: string;
        args?: string[];
        url?: string;
        env?: Record<string, string>;
        disabled?: boolean;
      }>;
    } | null;
    
    if (!config?.mcpServers) continue;
    
    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      // Skip mcpguard itself
      if (name === 'mcpguard') continue;
      
      mcps.push({
        name,
        command: serverConfig.command,
        args: serverConfig.args,
        url: serverConfig.url,
        env: serverConfig.env,
        source: 'copilot',
        enabled: !serverConfig.disabled,
      });
    }
    
    break;
  }
  
  return mcps;
}

/**
 * Load MCPs from Cursor config
 */
function loadCursorConfig(): MCPServerInfo[] {
  const mcps: MCPServerInfo[] = [];
  
  for (const configPath of IDE_CONFIG_PATHS.cursor) {
    if (!fileExists(configPath)) continue;
    
    const config = safeParseJSON(configPath) as {
      mcpServers?: Record<string, {
        command?: string;
        args?: string[];
        url?: string;
        env?: Record<string, string>;
        disabled?: boolean;
      }>;
    } | null;
    
    if (!config?.mcpServers) continue;
    
    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      // Skip mcpguard itself
      if (name === 'mcpguard') continue;
      
      mcps.push({
        name,
        command: serverConfig.command,
        args: serverConfig.args,
        url: serverConfig.url,
        env: serverConfig.env,
        source: 'cursor',
        enabled: !serverConfig.disabled,
      });
    }
    
    break;
  }
  
  return mcps;
}

/**
 * Load all MCP servers from all IDE configs
 */
export function loadAllMCPServers(): MCPServerInfo[] {
  const mcps: MCPServerInfo[] = [];
  const seenNames = new Set<string>();
  
  // Load from each IDE in priority order
  const sources = [
    loadClaudeConfig(),
    loadCopilotConfig(),
    loadCursorConfig(),
  ];
  
  for (const source of sources) {
    for (const mcp of source) {
      // Deduplicate by name (prefer earlier sources)
      if (!seenNames.has(mcp.name)) {
        seenNames.add(mcp.name);
        mcps.push(mcp);
      }
    }
  }
  
  return mcps;
}

/**
 * Get the path to the MCP Guard settings file
 */
export function getSettingsPath(): string {
  const configDir = path.join(os.homedir(), '.mcpguard');
  
  // Ensure directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  return path.join(configDir, 'settings.json');
}

/**
 * Get the list of detected IDE config paths
 */
export function getDetectedConfigs(): { ide: string; path: string }[] {
  const detected: { ide: string; path: string }[] = [];
  
  for (const [ide, paths] of Object.entries(IDE_CONFIG_PATHS)) {
    for (const configPath of paths) {
      if (fileExists(configPath)) {
        detected.push({ ide, path: configPath });
        break; // Only include first found for each IDE
      }
    }
  }
  
  return detected;
}








