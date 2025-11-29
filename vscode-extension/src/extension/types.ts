/**
 * MCP Guard Configuration Types
 */

/**
 * Network access configuration for Worker isolation
 */
export interface NetworkConfig {
  /** Whether network access is enabled (false = complete isolation) */
  enabled: boolean;
  /** Allowlist of domains/hosts that can be accessed */
  allowlist: string[];
  /** Whether to allow localhost access */
  allowLocalhost: boolean;
}

/**
 * File system access configuration
 */
export interface FileSystemConfig {
  /** Whether file system access is enabled */
  enabled: boolean;
  /** Directories that can be read from */
  readPaths: string[];
  /** Directories that can be written to */
  writePaths: string[];
}

/**
 * Resource limits for Worker execution
 */
export interface ResourceLimits {
  /** Maximum execution time in milliseconds */
  maxExecutionTimeMs: number;
  /** Maximum memory usage in MB */
  maxMemoryMB: number;
  /** Maximum number of MCP calls per execution */
  maxMCPCalls: number;
}

/**
 * Security settings for an MCP server
 */
export interface MCPSecurityConfig {
  /** Unique identifier for this configuration */
  id: string;
  /** Name of the MCP server */
  mcpName: string;
  /** Whether this MCP is guarded by MCP Guard */
  isGuarded: boolean;
  /** Network access configuration */
  network: NetworkConfig;
  /** File system access configuration */
  fileSystem: FileSystemConfig;
  /** Resource limits */
  resourceLimits: ResourceLimits;
  /** Last modified timestamp */
  lastModified: string;
}

/**
 * MCP server info from IDE config
 */
export interface MCPServerInfo {
  /** Name of the MCP server */
  name: string;
  /** Command to run the MCP server */
  command?: string;
  /** Arguments for the command */
  args?: string[];
  /** URL for URL-based MCPs */
  url?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Source IDE (claude, copilot, cursor) */
  source: 'claude' | 'copilot' | 'cursor' | 'unknown';
  /** Whether the server is currently enabled in the IDE config */
  enabled: boolean;
}

/**
 * Global MCP Guard settings
 */
export interface MCPGuardSettings {
  /** Whether MCP Guard is globally enabled */
  enabled: boolean;
  /** Default security settings for new MCPs */
  defaults: Omit<MCPSecurityConfig, 'id' | 'mcpName' | 'isGuarded' | 'lastModified'>;
  /** Per-MCP configurations */
  mcpConfigs: MCPSecurityConfig[];
}

/**
 * Message types for webview communication
 */
export type WebviewMessage =
  | { type: 'getSettings' }
  | { type: 'getMCPServers' }
  | { type: 'saveSettings'; data: MCPGuardSettings }
  | { type: 'saveMCPConfig'; data: MCPSecurityConfig }
  | { type: 'importFromIDE' }
  | { type: 'refreshMCPs' }
  | { type: 'openMCPGuardDocs' };

/**
 * Response messages from extension to webview
 */
export type ExtensionMessage =
  | { type: 'settings'; data: MCPGuardSettings }
  | { type: 'mcpServers'; data: MCPServerInfo[] }
  | { type: 'error'; message: string }
  | { type: 'success'; message: string }
  | { type: 'loading'; isLoading: boolean };

/**
 * Default security configuration
 */
export const DEFAULT_SECURITY_CONFIG: Omit<MCPSecurityConfig, 'id' | 'mcpName' | 'isGuarded' | 'lastModified'> = {
  network: {
    enabled: false,
    allowlist: [],
    allowLocalhost: false,
  },
  fileSystem: {
    enabled: false,
    readPaths: [],
    writePaths: [],
  },
  resourceLimits: {
    maxExecutionTimeMs: 30000,
    maxMemoryMB: 128,
    maxMCPCalls: 100,
  },
};

/**
 * Default global settings
 */
export const DEFAULT_SETTINGS: MCPGuardSettings = {
  enabled: true,
  defaults: DEFAULT_SECURITY_CONFIG,
  mcpConfigs: [],
};








