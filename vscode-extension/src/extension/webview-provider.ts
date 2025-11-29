/**
 * Webview Provider for MCP Guard Configuration Panel
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import { 
  loadAllMCPServers, 
  getSettingsPath, 
  disableMCPInIDE, 
  enableMCPInIDE,
  ensureMCPGuardInConfig,
  isMCPDisabled 
} from './config-loader';
import type { MCPGuardSettings, MCPSecurityConfig, WebviewMessage, ExtensionMessage } from './types';
import { DEFAULT_SETTINGS } from './types';

export class MCPGuardWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'mcpguard.configPanel';
  
  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;
  private _mcpCount: number = 0;

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
  }

  /**
   * Update the view badge to show MCP count or warning
   */
  private _updateBadge(): void {
    if (!this._view) return;
    
    if (this._mcpCount === 0) {
      // Show warning badge when no MCPs found
      this._view.badge = {
        tooltip: 'No MCP servers detected - click to import',
        value: '!'
      };
    } else {
      // Show count badge
      this._view.badge = {
        tooltip: `${this._mcpCount} MCP server${this._mcpCount === 1 ? '' : 's'} detected`,
        value: this._mcpCount
      };
    }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
      await this._handleMessage(message);
    });

    // Auto-import MCPs on view initialization
    this._autoImportOnInit();
  }

  /**
   * Automatically import MCPs when the view is first shown
   */
  private async _autoImportOnInit(): Promise<void> {
    // Small delay to ensure webview is ready
    setTimeout(() => {
      const mcps = loadAllMCPServers();
      this._mcpCount = mcps.length;
      this._updateBadge();
      
      // Log what we found for debugging
      console.log(`MCP Guard: Auto-imported ${mcps.length} MCP server(s)`);
      if (mcps.length > 0) {
        console.log('MCP Guard: Found servers:', mcps.map(m => `${m.name} (${m.source})`).join(', '));
      }
    }, 100);
  }

  /**
   * Send a message to the webview
   */
  private _postMessage(message: ExtensionMessage): void {
    this._view?.webview.postMessage(message);
  }

  /**
   * Handle messages from the webview
   */
  private async _handleMessage(message: WebviewMessage): Promise<void> {
    switch (message.type) {
      case 'getSettings':
        await this._sendSettings();
        break;
      
      case 'getMCPServers':
        await this._sendMCPServers();
        break;
      
      case 'saveSettings':
        await this._saveSettings(message.data);
        break;
      
      case 'saveMCPConfig':
        await this._saveMCPConfig(message.data);
        break;
      
      case 'importFromIDE':
        await this._importFromIDE();
        break;
      
      case 'refreshMCPs':
        await this._sendMCPServers();
        break;
      
      case 'openMCPGuardDocs':
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/mcpguard/mcpguard'));
        break;
    }
  }

  /**
   * Load and send current settings to webview
   */
  private async _sendSettings(): Promise<void> {
    try {
      const settingsPath = getSettingsPath();
      let settings: MCPGuardSettings = DEFAULT_SETTINGS;
      
      if (fs.existsSync(settingsPath)) {
        const content = fs.readFileSync(settingsPath, 'utf-8');
        settings = JSON.parse(content) as MCPGuardSettings;
      }
      
      this._postMessage({ type: 'settings', data: settings });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this._postMessage({ type: 'error', message: `Failed to load settings: ${message}` });
    }
  }

  /**
   * Load and send MCP servers from IDE configs
   */
  private async _sendMCPServers(): Promise<void> {
    try {
      this._postMessage({ type: 'loading', isLoading: true });
      const mcps = loadAllMCPServers();
      this._mcpCount = mcps.length;
      this._updateBadge();
      this._postMessage({ type: 'mcpServers', data: mcps });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this._postMessage({ type: 'error', message: `Failed to load MCP servers: ${message}` });
    } finally {
      this._postMessage({ type: 'loading', isLoading: false });
    }
  }

  /**
   * Save settings to file
   */
  private async _saveSettings(settings: MCPGuardSettings): Promise<void> {
    try {
      const settingsPath = getSettingsPath();
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      this._postMessage({ type: 'success', message: 'Settings saved successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this._postMessage({ type: 'error', message: `Failed to save settings: ${message}` });
    }
  }

  /**
   * Save a single MCP config and update IDE config if guard status changed
   */
  private async _saveMCPConfig(config: MCPSecurityConfig): Promise<void> {
    try {
      const settingsPath = getSettingsPath();
      let settings: MCPGuardSettings = DEFAULT_SETTINGS;
      
      if (fs.existsSync(settingsPath)) {
        const content = fs.readFileSync(settingsPath, 'utf-8');
        settings = JSON.parse(content) as MCPGuardSettings;
      }
      
      // Check if guard status changed
      const existingConfig = settings.mcpConfigs.find(c => c.id === config.id);
      const wasGuarded = existingConfig?.isGuarded ?? false;
      const isNowGuarded = config.isGuarded;
      const guardStatusChanged = wasGuarded !== isNowGuarded;
      
      // Update or add the MCP config in settings
      const existingIndex = settings.mcpConfigs.findIndex(c => c.id === config.id);
      if (existingIndex >= 0) {
        settings.mcpConfigs[existingIndex] = config;
      } else {
        settings.mcpConfigs.push(config);
      }
      
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      
      // If guard status changed, update IDE config
      let requiresRestart = false;
      if (guardStatusChanged) {
        if (isNowGuarded) {
          // Disable MCP in IDE config (move to _mcpguard_disabled)
          const result = disableMCPInIDE(config.mcpName);
          if (result.success) {
            requiresRestart = result.requiresRestart;
            console.log(`MCP Guard: ${config.mcpName} disabled in IDE config`);
          } else {
            console.warn(`MCP Guard: Failed to disable ${config.mcpName} in IDE: ${result.message}`);
          }
          
          // Also ensure mcpguard is in the config
          const extensionPath = this._extensionUri.fsPath;
          ensureMCPGuardInConfig(extensionPath);
        } else {
          // Enable MCP in IDE config (restore from _mcpguard_disabled)
          const result = enableMCPInIDE(config.mcpName);
          if (result.success) {
            requiresRestart = result.requiresRestart;
            console.log(`MCP Guard: ${config.mcpName} enabled in IDE config`);
          } else {
            console.warn(`MCP Guard: Failed to enable ${config.mcpName} in IDE: ${result.message}`);
          }
        }
      }
      
      this._postMessage({ type: 'success', message: `Configuration for "${config.mcpName}" saved` });
      this._postMessage({ type: 'settings', data: settings });
      
      // Refresh MCP list to show updated status
      await this._sendMCPServers();
      
      // Show restart prompt if needed
      if (requiresRestart) {
        this._showRestartPrompt(config.mcpName, isNowGuarded);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this._postMessage({ type: 'error', message: `Failed to save MCP config: ${message}` });
    }
  }
  
  /**
   * Show a prompt to restart the IDE after config changes
   */
  private _showRestartPrompt(mcpName: string, isGuarded: boolean): void {
    const action = isGuarded ? 'guarded' : 'unguarded';
    const message = `${mcpName} is now ${action}. Restart Cursor/VS Code to apply changes.`;
    
    vscode.window.showInformationMessage(message, 'Restart Now', 'Later').then(selection => {
      if (selection === 'Restart Now') {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    });
  }

  /**
   * Import MCPs from IDE configs
   */
  private async _importFromIDE(): Promise<void> {
    await this._sendMCPServers();
    this._postMessage({ type: 'success', message: 'MCPs imported from IDE configurations' });
  }

  /**
   * Refresh the webview
   */
  public refresh(): void {
    if (this._view) {
      this._sendSettings();
      this._sendMCPServers();
    }
  }

  /**
   * Generate HTML content for the webview
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    // Get the webview script URI
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'index.js')
    );

    // Generate a nonce for security
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>MCP Guard</title>
  <style>
    :root {
      --bg-primary: var(--vscode-editor-background);
      --bg-secondary: var(--vscode-sideBar-background);
      --bg-hover: var(--vscode-list-hoverBackground);
      --bg-active: var(--vscode-list-activeSelectionBackground);
      --text-primary: var(--vscode-foreground);
      --text-secondary: var(--vscode-descriptionForeground);
      --text-muted: var(--vscode-disabledForeground);
      --border-color: var(--vscode-panel-border);
      --accent: #22c55e;
      --accent-secondary: #22c55e;
      --accent-light: rgba(34, 197, 94, 0.15);
      --success: #22c55e;
      --warning: var(--vscode-terminal-ansiYellow);
      --error: var(--vscode-errorForeground);
      --radius-sm: 4px;
      --radius-md: 8px;
      --radius-lg: 12px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--text-primary);
      background: var(--bg-primary);
      line-height: 1.5;
      padding: 0;
      min-height: 100vh;
    }

    #root {
      min-height: 100vh;
    }

    /* Loading spinner */
    .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid var(--text-muted);
      border-radius: 50%;
      border-top-color: #22c55e;
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-8px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }

    .animate-slide-in {
      animation: slideIn 0.3s ease-out;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

/**
 * Generate a random nonce for CSP
 */
function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}


