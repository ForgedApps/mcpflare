/**
 * Tests for extension/index.ts
 * Tests extension activation, deactivation, and command registration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as os from 'os';
import * as path from 'path';
import { addMockFile, getMockFileContent, resetMockFs } from '../setup';

// Helper to get test config paths
function getTestConfigPath(ide: 'cursor' | 'claude'): string {
  switch (ide) {
    case 'claude':
      return path.join(os.homedir(), '.claude', 'mcp.json');
    case 'cursor':
      return path.join(os.homedir(), '.cursor', 'mcp.json');
  }
}

function createSampleMCPConfig(
  mcpServers: Record<string, unknown>,
  extras?: Record<string, unknown>,
): string {
  return JSON.stringify({ mcpServers, ...extras }, null, 2);
}

// Get access to the vscode mock from setup
import * as vscode from 'vscode';

// Import after mocks
import { activate, deactivate } from '../../src/extension/index';

describe('extension/index', () => {
  let mockContext: {
    extensionUri: { fsPath: string };
    extensionPath: string;
    subscriptions: Array<{ dispose?: () => void }>;
    globalState: {
      get: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    resetMockFs();
    vi.clearAllMocks();
    vi.mocked(vscode.extensions.getExtension).mockImplementation((id: string) => ({
      id,
      isActive: true,
      packageJSON: { version: 'test' },
    }) as unknown as import('vscode').Extension<unknown>);
    
    mockContext = {
      extensionUri: { fsPath: '/mock/extension' },
      extensionPath: '/mock/extension',
      subscriptions: [],
      globalState: {
        get: vi.fn().mockReturnValue(true), // hasShownWelcome = true to skip welcome
        update: vi.fn(),
      },
    };
  });

  describe('activate', () => {
    it('should register webview provider', () => {
      activate(mockContext as unknown as import('vscode').ExtensionContext);

      expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalled();
      expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalledWith(
        'mcpflare.configPanel',
        expect.anything()
      );
    });

    it('should register openSettings command', () => {
      activate(mockContext as unknown as import('vscode').ExtensionContext);

      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'mcpflare.openSettings',
        expect.any(Function)
      );
    });

    it('should register refreshMCPs command', () => {
      activate(mockContext as unknown as import('vscode').ExtensionContext);

      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'mcpflare.refreshMCPs',
        expect.any(Function)
      );
    });

    it('should register importFromIDE command', () => {
      activate(mockContext as unknown as import('vscode').ExtensionContext);

      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'mcpflare.importFromIDE',
        expect.any(Function)
      );
    });

    it('should add subscriptions for cleanup', () => {
      activate(mockContext as unknown as import('vscode').ExtensionContext);

      // Should have multiple subscriptions (webview provider + commands + cleanup)
      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
    });

    it('should show welcome message on first activation', () => {
      mockContext.globalState.get = vi.fn().mockReturnValue(false); // First time

      activate(mockContext as unknown as import('vscode').ExtensionContext);

      expect(vscode.window.showInformationMessage).toHaveBeenCalled();
      expect(mockContext.globalState.update).toHaveBeenCalledWith(
        'mcpflare.hasShownWelcome',
        true
      );
    });

    it('should not show welcome message on subsequent activations', () => {
      mockContext.globalState.get = vi.fn().mockReturnValue(true); // Already shown

      // Clear previous calls
      vi.mocked(vscode.window.showInformationMessage).mockClear();
      vi.mocked(mockContext.globalState.update).mockClear();

      activate(mockContext as unknown as import('vscode').ExtensionContext);

      // globalState.update should not be called when hasShownWelcome is true
      expect(mockContext.globalState.update).not.toHaveBeenCalledWith(
        'mcpflare.hasShownWelcome',
        true
      );
    });

    it('should load MCPs on activation', () => {
      const cursorPath = getTestConfigPath('cursor');
      addMockFile(cursorPath, createSampleMCPConfig({
        'test-mcp': { command: 'node', args: ['test.js'] },
      }));

      // This should not throw and should log MCP detection
      activate(mockContext as unknown as import('vscode').ExtensionContext);

      // Extension should activate successfully
      expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalled();
    });

    it('should ensure mcpflare is added to IDE config on activation', () => {
      const cursorPath = getTestConfigPath('cursor');
      addMockFile(cursorPath, createSampleMCPConfig({
        github: { url: 'https://api.github.com/mcp' },
      }));

      activate(mockContext as unknown as import('vscode').ExtensionContext);

      const savedConfig = JSON.parse(getMockFileContent(cursorPath)!);
      expect(savedConfig.mcpServers.mcpflare).toBeDefined();
      expect(savedConfig.mcpServers.mcpflare.command).toBe('node');
      expect(savedConfig.mcpServers.mcpflare.args[0]).toBe(
        path.join(
          '/mock/extension',
          'mcpflare-server',
          'dist',
          'server',
          'index.js',
        ),
      );
    });

    it('should spawn bundled server path for marketplace installs', () => {
      const logSpy = vi.spyOn(console, 'log');
      const bundledServerPath = path.join(
        '/mock/extension',
        'mcpflare-server',
        'dist',
        'server',
        'index.js',
      );
      addMockFile(bundledServerPath, 'console.log("server")');

      activate(mockContext as unknown as import('vscode').ExtensionContext);

      expect(logSpy).toHaveBeenCalledWith(
        `MCPflare: Spawning server from ${bundledServerPath}`,
      );
    });

    it('should not spawn server when bundled path is missing', () => {
      const logSpy = vi.spyOn(console, 'log');
      activate(mockContext as unknown as import('vscode').ExtensionContext);
      const bundledServerPath = path.join(
        '/mock/extension',
        'mcpflare-server',
        'dist',
        'server',
        'index.js',
      );
      expect(logSpy).toHaveBeenCalledWith(
        `MCPflare: Server not found at ${bundledServerPath}, skipping spawn`,
      );
    });

    describe('command handlers', () => {
      it('openSettings command should execute workbench view command', () => {
        activate(mockContext as unknown as import('vscode').ExtensionContext);

        // Find the openSettings command registration
        const calls = vi.mocked(vscode.commands.registerCommand).mock.calls;
        const openSettingsCall = calls.find(
          (call) => call[0] === 'mcpflare.openSettings'
        );
        
        expect(openSettingsCall).toBeDefined();
        
        // Execute the handler
        const handler = openSettingsCall![1] as () => void;
        handler();

        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
          'workbench.view.extension.mcpflare'
        );
      });

      it('refreshMCPs command should show info message', () => {
        activate(mockContext as unknown as import('vscode').ExtensionContext);

        // Find the refreshMCPs command registration
        const calls = vi.mocked(vscode.commands.registerCommand).mock.calls;
        const refreshCall = calls.find(
          (call) => call[0] === 'mcpflare.refreshMCPs'
        );
        
        expect(refreshCall).toBeDefined();
        
        // Execute the handler
        const handler = refreshCall![1] as () => void;
        handler();

        expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
          'MCPflare: Refreshed MCP list'
        );
      });

      it('importFromIDE command should show info message', () => {
        activate(mockContext as unknown as import('vscode').ExtensionContext);

        // Find the importFromIDE command registration
        const calls = vi.mocked(vscode.commands.registerCommand).mock.calls;
        const importCall = calls.find(
          (call) => call[0] === 'mcpflare.importFromIDE'
        );
        
        expect(importCall).toBeDefined();
        
        // Execute the handler
        const handler = importCall![1] as () => void;
        handler();

        expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
          'MCPflare: Imported MCPs from IDE configurations'
        );
      });
    });
  });

  describe('deactivate', () => {
    it('should not throw when called', () => {
      expect(() => deactivate()).not.toThrow();
    });

    it('should be callable multiple times', () => {
      expect(() => {
        deactivate();
        deactivate();
      }).not.toThrow();
    });

    it('should remove mcpflare and restore disabled MCPs on uninstall cleanup', () => {
      const cursorPath = getTestConfigPath('cursor');
      addMockFile(cursorPath, createSampleMCPConfig(
        {
          mcpflare: { command: 'node', args: ['mcpflare.js'] },
        },
        {
          _mcpflare_metadata: { disabled_at: '2026-02-12T00:00:00.000Z' },
          _mcpflare_disabled: {
            context7: { url: 'https://mcp.context7.com/mcp', headers: {} },
          },
        },
      ));

      activate(mockContext as unknown as import('vscode').ExtensionContext);

      const extensionChangeHandler = vi.mocked(vscode.extensions.onDidChange).mock
        .calls[0]?.[0] as (() => void) | undefined;
      expect(extensionChangeHandler).toBeDefined();

      vi.mocked(vscode.extensions.getExtension).mockReturnValue(undefined);
      extensionChangeHandler?.();

      deactivate();

      const savedConfig = JSON.parse(getMockFileContent(cursorPath)!);
      expect(savedConfig.mcpServers.mcpflare).toBeUndefined();
      expect(savedConfig.mcpServers.context7).toBeDefined();
      expect(savedConfig._mcpflare_disabled).toBeUndefined();
      expect(savedConfig._mcpflare_metadata).toBeUndefined();
    });
  });

  describe('welcome message variations', () => {
    it('should show MCP count in welcome when MCPs found', () => {
      mockContext.globalState.get = vi.fn().mockReturnValue(false);
      
      const cursorPath = getTestConfigPath('cursor');
      addMockFile(cursorPath, createSampleMCPConfig({
        'mcp-1': { command: 'node' },
        'mcp-2': { command: 'node' },
      }));

      activate(mockContext as unknown as import('vscode').ExtensionContext);

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('2'),
        'Open Settings'
      );
    });

    it('should show no MCPs message when none found', () => {
      mockContext.globalState.get = vi.fn().mockReturnValue(false);

      activate(mockContext as unknown as import('vscode').ExtensionContext);

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('No MCP servers detected'),
        'Open Settings'
      );
    });
  });
});
