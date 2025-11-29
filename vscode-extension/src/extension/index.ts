/**
 * MCP Guard - VS Code Extension
 * 
 * Provides a graphical interface for configuring MCP servers
 * with security isolation settings.
 */

import * as vscode from 'vscode';
import { MCPGuardWebviewProvider } from './webview-provider';

let webviewProvider: MCPGuardWebviewProvider | undefined;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('MCP Guard extension activated');

  // Create the webview provider
  webviewProvider = new MCPGuardWebviewProvider(context.extensionUri);

  // Register the webview provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      MCPGuardWebviewProvider.viewType,
      webviewProvider
    )
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('mcpguard.openSettings', () => {
      vscode.commands.executeCommand('workbench.view.extension.mcpguard');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mcpguard.refreshMCPs', () => {
      webviewProvider?.refresh();
      vscode.window.showInformationMessage('MCP Guard: Refreshed MCP list');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mcpguard.importFromIDE', () => {
      webviewProvider?.refresh();
      vscode.window.showInformationMessage('MCP Guard: Imported MCPs from IDE configurations');
    })
  );

  // Show welcome message on first activation
  const hasShownWelcome = context.globalState.get('mcpguard.hasShownWelcome');
  if (!hasShownWelcome) {
    vscode.window.showInformationMessage(
      'MCP Guard is now active. Click the shield icon in the activity bar to configure your MCP servers.',
      'Open Settings'
    ).then(selection => {
      if (selection === 'Open Settings') {
        vscode.commands.executeCommand('workbench.view.extension.mcpguard');
      }
    });
    context.globalState.update('mcpguard.hasShownWelcome', true);
  }
}

/**
 * Extension deactivation
 */
export function deactivate(): void {
  console.log('MCP Guard extension deactivated');
}


