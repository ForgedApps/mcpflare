/**
 * MCP Registry
 * 
 * Reads security isolation settings from the MCP Guard Manager VS Code extension
 * and provides them to the Worker Manager for configuring Worker isolates.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import logger from './logger.js'

/**
 * Network access configuration
 */
export interface NetworkConfig {
  enabled: boolean
  allowlist: string[]
  allowLocalhost: boolean
}

/**
 * File system access configuration
 */
export interface FileSystemConfig {
  enabled: boolean
  readPaths: string[]
  writePaths: string[]
}

/**
 * Resource limits configuration
 */
export interface ResourceLimits {
  maxExecutionTimeMs: number
  maxMemoryMB: number
  maxMCPCalls: number
}

/**
 * Security configuration for an MCP server
 */
export interface MCPSecurityConfig {
  id: string
  mcpName: string
  isGuarded: boolean
  network: NetworkConfig
  fileSystem: FileSystemConfig
  resourceLimits: ResourceLimits
  lastModified: string
}

/**
 * Global MCP Guard settings
 */
export interface MCPGuardSettings {
  enabled: boolean
  defaults: Omit<MCPSecurityConfig, 'id' | 'mcpName' | 'isGuarded' | 'lastModified'>
  mcpConfigs: MCPSecurityConfig[]
}

/**
 * Worker isolation configuration for runtime use
 */
export interface WorkerIsolationConfig {
  mcpName: string
  isGuarded: boolean
  outbound: {
    allowedHosts: string[] | null
    allowLocalhost: boolean
  }
  fileSystem: {
    enabled: boolean
    readPaths: string[]
    writePaths: string[]
  }
  limits: {
    cpuMs: number
    memoryMB: number
    subrequests: number
  }
}

/**
 * Default security configuration
 */
const DEFAULT_SECURITY_CONFIG: Omit<MCPSecurityConfig, 'id' | 'mcpName' | 'isGuarded' | 'lastModified'> = {
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
}

/**
 * Default global settings
 */
const DEFAULT_SETTINGS: MCPGuardSettings = {
  enabled: true,
  defaults: DEFAULT_SECURITY_CONFIG,
  mcpConfigs: [],
}

/**
 * Get the path to the MCP Guard settings file
 */
export function getSettingsPath(): string {
  const configDir = join(homedir(), '.mcpguard')
  
  // Ensure directory exists
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }
  
  return join(configDir, 'settings.json')
}

/**
 * Load MCP Guard settings from disk
 */
export function loadSettings(): MCPGuardSettings {
  const settingsPath = getSettingsPath()
  
  if (!existsSync(settingsPath)) {
    logger.debug({ settingsPath }, 'No MCP Guard settings file found, using defaults')
    return DEFAULT_SETTINGS
  }
  
  try {
    const content = readFileSync(settingsPath, 'utf-8')
    const settings = JSON.parse(content) as MCPGuardSettings
    logger.debug({ settingsPath, mcpCount: settings.mcpConfigs.length }, 'Loaded MCP Guard settings')
    return settings
  } catch (error) {
    logger.warn({ error, settingsPath }, 'Failed to load MCP Guard settings, using defaults')
    return DEFAULT_SETTINGS
  }
}

/**
 * Save MCP Guard settings to disk
 */
export function saveSettings(settings: MCPGuardSettings): void {
  const settingsPath = getSettingsPath()
  
  try {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
    logger.debug({ settingsPath }, 'Saved MCP Guard settings')
  } catch (error) {
    logger.error({ error, settingsPath }, 'Failed to save MCP Guard settings')
    throw error
  }
}

/**
 * Convert MCPSecurityConfig to WorkerIsolationConfig
 */
export function toWorkerIsolationConfig(config: MCPSecurityConfig): WorkerIsolationConfig {
  return {
    mcpName: config.mcpName,
    isGuarded: config.isGuarded,
    outbound: {
      allowedHosts: config.network.enabled && config.network.allowlist.length > 0 
        ? config.network.allowlist 
        : null,
      allowLocalhost: config.network.enabled && config.network.allowLocalhost,
    },
    fileSystem: {
      enabled: config.fileSystem.enabled,
      readPaths: config.fileSystem.readPaths,
      writePaths: config.fileSystem.writePaths,
    },
    limits: {
      cpuMs: config.resourceLimits.maxExecutionTimeMs,
      memoryMB: config.resourceLimits.maxMemoryMB,
      subrequests: config.resourceLimits.maxMCPCalls,
    },
  }
}

/**
 * Get isolation configuration for a specific MCP
 * Returns undefined if no configuration exists or MCP Guard is disabled
 */
export function getIsolationConfigForMCP(mcpName: string): WorkerIsolationConfig | undefined {
  const settings = loadSettings()
  
  // Check if MCP Guard is globally enabled
  if (!settings.enabled) {
    logger.debug({ mcpName }, 'MCP Guard is globally disabled')
    return undefined
  }
  
  // Find config for this MCP
  const config = settings.mcpConfigs.find(c => c.mcpName === mcpName)
  
  if (!config) {
    logger.debug({ mcpName }, 'No MCP Guard config found for MCP')
    return undefined
  }
  
  if (!config.isGuarded) {
    logger.debug({ mcpName }, 'MCP is not guarded')
    return undefined
  }
  
  return toWorkerIsolationConfig(config)
}

/**
 * Get all guarded MCP configurations
 */
export function getAllGuardedMCPs(): Map<string, WorkerIsolationConfig> {
  const settings = loadSettings()
  const configs = new Map<string, WorkerIsolationConfig>()
  
  if (!settings.enabled) {
    return configs
  }
  
  for (const config of settings.mcpConfigs) {
    if (config.isGuarded) {
      configs.set(config.mcpName, toWorkerIsolationConfig(config))
    }
  }
  
  logger.debug({ count: configs.size }, 'Loaded guarded MCP configurations')
  return configs
}

/**
 * Check if an MCP should be guarded
 */
export function isMCPGuarded(mcpName: string): boolean {
  const settings = loadSettings()
  
  if (!settings.enabled) {
    return false
  }
  
  const config = settings.mcpConfigs.find(c => c.mcpName === mcpName)
  return config?.isGuarded ?? false
}

/**
 * Create a default configuration for an MCP
 */
export function createDefaultConfig(mcpName: string): MCPSecurityConfig {
  const settings = loadSettings()
  
  return {
    id: `config-${mcpName}-${Date.now()}`,
    mcpName,
    isGuarded: false,
    ...settings.defaults,
    lastModified: new Date().toISOString(),
  }
}

/**
 * Add or update an MCP configuration
 */
export function upsertMCPConfig(config: MCPSecurityConfig): void {
  const settings = loadSettings()
  
  const existingIndex = settings.mcpConfigs.findIndex(c => c.mcpName === config.mcpName)
  
  if (existingIndex >= 0) {
    settings.mcpConfigs[existingIndex] = config
  } else {
    settings.mcpConfigs.push(config)
  }
  
  saveSettings(settings)
  logger.info({ mcpName: config.mcpName, isGuarded: config.isGuarded }, 'Updated MCP configuration')
}

/**
 * Remove an MCP configuration
 */
export function removeMCPConfig(mcpName: string): void {
  const settings = loadSettings()
  
  settings.mcpConfigs = settings.mcpConfigs.filter(c => c.mcpName !== mcpName)
  
  saveSettings(settings)
  logger.info({ mcpName }, 'Removed MCP configuration')
}








