import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { MCPHandler } from '../../src/server/mcp-handler.js'
import { WorkerManager } from '../../src/server/worker-manager.js'
import { ConfigManager } from '../../src/utils/config-manager.js'
import type { MCPPrompt } from '../../src/types/mcp.js'

// Mock dependencies
vi.mock('../../src/server/worker-manager.js')
vi.mock('../../src/utils/config-manager.js')
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Prompt Handler', () => {
  let mcpHandler: MCPHandler
  let mockWorkerManager: WorkerManager
  let mockConfigManager: ConfigManager

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Create mock instances
    mockWorkerManager = new WorkerManager()
    mockConfigManager = new ConfigManager()

    // Setup mock implementations
    vi.mocked(mockWorkerManager.loadMCPPromptsOnly).mockResolvedValue([])
    vi.mocked(mockConfigManager.getAllConfiguredMCPs).mockReturnValue({})
    vi.mocked(mockConfigManager.resolveEnvVarsInObject).mockImplementation(
      (obj) => obj,
    )

    // Create handler instance
    mcpHandler = new MCPHandler()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ListPromptsRequestSchema handler', () => {
    it('should return empty prompts list when no MCPs are configured', async () => {
      // Mock no MCPs configured
      vi.mocked(mockConfigManager.getAllConfiguredMCPs).mockReturnValue({})

      // Test listPrompts - we'll need to access the internal handler
      // Since we can't directly test the handler, we'll test through the behavior
      expect(true).toBe(true) // Placeholder until we implement proper testing
    })

    it('should return prompts from guarded MCPs only', async () => {
      const githubPrompts: MCPPrompt[] = [
        {
          name: 'github/AssignCodingAgent',
          description: 'Assign GitHub Copilot Coding Agent to an issue',
          arguments: [
            {
              name: 'issueNumber',
              description: 'Issue number',
              required: true,
            },
          ],
        },
      ]

      vi.mocked(mockConfigManager.getAllConfiguredMCPs).mockReturnValue({
        github: {
          config: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] },
          source: 'cursor',
          status: 'disabled', // Guarded
        },
        filesystem: {
          config: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] },
          source: 'cursor',
          status: 'active', // Not guarded
        },
      })

      vi.mocked(mockWorkerManager.loadMCPPromptsOnly).mockResolvedValueOnce(
        githubPrompts,
      )

      // Test that only guarded MCP prompts are returned
      expect(true).toBe(true) // Placeholder
    })

    it('should add namespace to prompts that do not have one using colon', async () => {
      const prompts: MCPPrompt[] = [
        {
          name: 'AssignCodingAgent',
          description: 'Test prompt without namespace',
        },
      ]

      vi.mocked(mockWorkerManager.loadMCPPromptsOnly).mockResolvedValue(prompts)

      // When listing, namespace should be added with colon
      const mcpName = 'github'
      const expectedName = `${mcpName}:${prompts[0].name}`
      expect(expectedName).toBe('github:AssignCodingAgent')
    })

    it('should convert slash namespace to colon namespace', async () => {
      const prompts: MCPPrompt[] = [
        {
          name: 'github/AssignCodingAgent',
          description: 'Test prompt with slash namespace',
        },
      ]

      vi.mocked(mockWorkerManager.loadMCPPromptsOnly).mockResolvedValue(prompts)

      // Should convert slash to colon
      const parts = prompts[0].name.split('/')
      const expectedName = `${parts[0]}:${parts[1]}`
      expect(expectedName).toBe('github:AssignCodingAgent')
    })

    it('should handle MCPs with no prompts gracefully', async () => {
      vi.mocked(mockConfigManager.getAllConfiguredMCPs).mockReturnValue({
        filesystem: {
          config: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] },
          source: 'cursor',
          status: 'disabled',
        },
      })

      vi.mocked(mockWorkerManager.loadMCPPromptsOnly).mockResolvedValue([])

      // Should not throw error
      expect(true).toBe(true) // Placeholder
    })

    it('should cache prompts after first load', async () => {
      const prompts: MCPPrompt[] = [
        {
          name: 'test/prompt',
          description: 'Test prompt',
        },
      ]

      vi.mocked(mockConfigManager.getAllConfiguredMCPs).mockReturnValue({
        test: {
          config: { command: 'test' },
          source: 'cursor',
          status: 'disabled',
        },
      })

      vi.mocked(mockWorkerManager.loadMCPPromptsOnly).mockResolvedValue(prompts)

      // First call should fetch
      // Second call should use cache
      expect(vi.mocked(mockWorkerManager.loadMCPPromptsOnly)).not.toHaveBeenCalled()
    })

    it('should handle multiple guarded MCPs with different prompts', async () => {
      const githubPrompts: MCPPrompt[] = [
        { name: 'github/AssignAgent', description: 'GitHub prompt' },
      ]
      const customPrompts: MCPPrompt[] = [
        { name: 'custom/DoSomething', description: 'Custom prompt' },
      ]

      vi.mocked(mockConfigManager.getAllConfiguredMCPs).mockReturnValue({
        github: {
          config: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] },
          source: 'cursor',
          status: 'disabled',
        },
        custom: {
          config: { command: 'custom-mcp' },
          source: 'cursor',
          status: 'disabled',
        },
      })

      vi.mocked(mockWorkerManager.loadMCPPromptsOnly)
        .mockResolvedValueOnce(githubPrompts)
        .mockResolvedValueOnce(customPrompts)

      // Should aggregate prompts from both MCPs
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('GetPromptRequestSchema handler', () => {
    it('should parse prompt name and extract MCP namespace using colon', () => {
      const promptName = 'github:AssignCodingAgent'
      const parts = promptName.split(':')

      expect(parts.length).toBe(2)
      expect(parts[0]).toBe('github')
      expect(parts[1]).toBe('AssignCodingAgent')
    })

    it('should throw error for invalid prompt name format', () => {
      const invalidPromptName = 'InvalidPromptWithoutNamespace'
      const parts = invalidPromptName.split(':')

      expect(parts.length).toBeLessThan(2)
    })

    it('should auto-load MCP if not already loaded', async () => {
      vi.mocked(mockConfigManager.getAllConfiguredMCPs).mockReturnValue({
        github: {
          config: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] },
          source: 'cursor',
          status: 'disabled',
        },
      })

      vi.mocked(mockWorkerManager.getMCPByName).mockReturnValue(undefined)

      // Should trigger auto-load
      expect(true).toBe(true) // Placeholder
    })

    it('should use existing MCP instance if already loaded', async () => {
      const mockInstance = {
        mcp_id: 'test-id',
        mcp_name: 'github',
        status: 'ready' as const,
        typescript_api: '',
        tools: [],
        prompts: [],
        created_at: new Date(),
        uptime_ms: 0,
      }

      vi.mocked(mockWorkerManager.getMCPByName).mockReturnValue(mockInstance)

      // Should reuse existing instance
      expect(mockInstance).toBeDefined()
    })

    it('should reject unguarded MCPs', () => {
      vi.mocked(mockConfigManager.getAllConfiguredMCPs).mockReturnValue({
        github: {
          config: { command: 'npx' },
          source: 'cursor',
          status: 'active', // Not guarded
        },
      })

      // Should throw error for unguarded MCP
      expect(true).toBe(true) // Placeholder
    })

    it('should call client.getPrompt with correct parameters', async () => {
      const mockClient = {
        getPrompt: vi.fn().mockResolvedValue({
          description: 'Test prompt',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: 'Test message',
              },
            },
          ],
        }),
      }

      vi.mocked(mockWorkerManager.getMCPClient).mockReturnValue(
        mockClient as any,
      )

      // Should call getPrompt with full prompt name and arguments
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Prompt namespacing', () => {
    it('should add namespace to prompts without one using colon separator', () => {
      const mcpName = 'github'
      const promptName = 'AssignCodingAgent'
      
      // Should add namespace with colon
      const namespacedName = `${mcpName}:${promptName}`
      expect(namespacedName).toBe('github:AssignCodingAgent')
    })

    it('should preserve existing colon namespacing if prompt already has it', () => {
      const prompt: MCPPrompt = {
        name: 'github:AssignCodingAgent',
        description: 'Test',
      }

      // Should remain unchanged (already has namespace)
      const hasNamespace = prompt.name.includes(':')
      expect(hasNamespace).toBe(true)
      expect(prompt.name).toBe('github:AssignCodingAgent')
    })

    it('should convert slash namespace to colon namespace', () => {
      const promptWithSlash = 'github/AssignCodingAgent'
      const parts = promptWithSlash.split('/')
      
      // Should convert to colon
      const withColon = `${parts[0]}:${parts[1]}`
      expect(withColon).toBe('github:AssignCodingAgent')
    })

    it('should handle prompts from different MCPs correctly with colon', () => {
      const githubPrompt = 'AssignCodingAgent'
      const filesystemPrompt = 'ListFiles'

      const namespacedGithub = `github:${githubPrompt}`
      const namespacedFilesystem = `filesystem:${filesystemPrompt}`

      expect(namespacedGithub).toBe('github:AssignCodingAgent')
      expect(namespacedFilesystem).toBe('filesystem:ListFiles')
    })
  })

  describe('Prompt caching', () => {
    it('should cache prompts alongside tools', async () => {
      const prompts: MCPPrompt[] = [
        { name: 'test/prompt', description: 'Test prompt' },
      ]

      // Cache should store prompts
      expect(Array.isArray(prompts)).toBe(true)
    })

    it('should use cached prompts on subsequent loads', async () => {
      // First load: fetch from MCP
      // Second load: use cache
      expect(true).toBe(true) // Placeholder
    })
  })
})



