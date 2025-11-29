/**
 * Shared types for the webview
 * These are duplicated from extension/types.ts to avoid import issues in the browser context
 */

export interface NetworkConfig {
  enabled: boolean;
  allowlist: string[];
  allowLocalhost: boolean;
}

export interface FileSystemConfig {
  enabled: boolean;
  readPaths: string[];
  writePaths: string[];
}

export interface ResourceLimits {
  maxExecutionTimeMs: number;
  maxMemoryMB: number;
  maxMCPCalls: number;
}

export interface MCPSecurityConfig {
  id: string;
  mcpName: string;
  isGuarded: boolean;
  network: NetworkConfig;
  fileSystem: FileSystemConfig;
  resourceLimits: ResourceLimits;
  lastModified: string;
}

export interface MCPServerInfo {
  name: string;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  source: 'claude' | 'copilot' | 'cursor' | 'unknown';
  enabled: boolean;
}

export interface MCPGuardSettings {
  enabled: boolean;
  defaults: Omit<MCPSecurityConfig, 'id' | 'mcpName' | 'isGuarded' | 'lastModified'>;
  mcpConfigs: MCPSecurityConfig[];
}

export type WebviewMessage =
  | { type: 'getSettings' }
  | { type: 'getMCPServers' }
  | { type: 'saveSettings'; data: MCPGuardSettings }
  | { type: 'saveMCPConfig'; data: MCPSecurityConfig }
  | { type: 'importFromIDE' }
  | { type: 'refreshMCPs' }
  | { type: 'openMCPGuardDocs' };

export type ExtensionMessage =
  | { type: 'settings'; data: MCPGuardSettings }
  | { type: 'mcpServers'; data: MCPServerInfo[] }
  | { type: 'error'; message: string }
  | { type: 'success'; message: string }
  | { type: 'loading'; isLoading: boolean };

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

export const DEFAULT_SETTINGS: MCPGuardSettings = {
  enabled: true,
  defaults: DEFAULT_SECURITY_CONFIG,
  mcpConfigs: [],
};

// VSCode API type for webview context
declare global {
  interface Window {
    acquireVsCodeApi: () => {
      postMessage: (message: WebviewMessage) => void;
      getState: () => unknown;
      setState: (state: unknown) => void;
    };
  }
}








