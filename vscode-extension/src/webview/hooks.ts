/**
 * React hooks for the MCP Guard webview
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MCPGuardSettings, MCPServerInfo, ExtensionMessage, WebviewMessage, MCPSecurityConfig } from './types';
import { DEFAULT_SETTINGS } from './types';

// Get VS Code API (singleton)
const vscode = window.acquireVsCodeApi();

/**
 * Post a message to the extension
 */
export function postMessage(message: WebviewMessage): void {
  vscode.postMessage(message);
}

/**
 * Hook to manage settings state
 */
export function useSettings() {
  const [settings, setSettings] = useState<MCPGuardSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Request initial settings
    postMessage({ type: 'getSettings' });

    // Listen for messages from extension
    const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
      const message = event.data;
      
      if (message.type === 'settings') {
        setSettings(message.data);
        setIsLoading(false);
      } else if (message.type === 'loading') {
        setIsLoading(message.isLoading);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const saveSettings = useCallback((newSettings: MCPGuardSettings) => {
    setSettings(newSettings);
    postMessage({ type: 'saveSettings', data: newSettings });
  }, []);

  const saveMCPConfig = useCallback((config: MCPSecurityConfig) => {
    postMessage({ type: 'saveMCPConfig', data: config });
  }, []);

  return { settings, setSettings, isLoading, saveSettings, saveMCPConfig };
}

/**
 * Hook to manage MCP servers state
 */
export function useMCPServers() {
  const [servers, setServers] = useState<MCPServerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Request initial MCP servers
    postMessage({ type: 'getMCPServers' });

    // Listen for messages from extension
    const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
      const message = event.data;
      
      if (message.type === 'mcpServers') {
        setServers(message.data);
        setIsLoading(false);
      } else if (message.type === 'loading') {
        setIsLoading(message.isLoading);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const refresh = useCallback(() => {
    setIsLoading(true);
    postMessage({ type: 'refreshMCPs' });
  }, []);

  return { servers, isLoading, refresh };
}

/**
 * Hook to manage notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);
  const notificationIdRef = useRef(0);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
      const message = event.data;
      
      if (message.type === 'success' || message.type === 'error') {
        const id = `notification-${notificationIdRef.current++}`;
        setNotifications(prev => [...prev, { id, type: message.type, message: message.message }]);
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return { notifications, dismiss };
}








