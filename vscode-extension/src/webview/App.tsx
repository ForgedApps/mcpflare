/**
 * Main App component for MCP Guard webview
 */

import React from 'react';
import { useSettings, useMCPServers, useNotifications, postMessage } from './hooks';
import { Header, MCPCard, EmptyState, Notification, Button, ShieldIcon } from './components';
import type { MCPSecurityConfig, MCPGuardSettings } from './types';

export const App: React.FC = () => {
  const { settings, saveSettings, saveMCPConfig, isLoading: settingsLoading } = useSettings();
  const { servers, isLoading: serversLoading, refresh } = useMCPServers();
  const { notifications, dismiss } = useNotifications();

  const isLoading = settingsLoading || serversLoading;

  const handleGlobalToggle = (enabled: boolean) => {
    const newSettings: MCPGuardSettings = { ...settings, enabled };
    saveSettings(newSettings);
  };

  const handleConfigChange = (config: MCPSecurityConfig) => {
    saveMCPConfig(config);
  };

  const handleImport = () => {
    postMessage({ type: 'importFromIDE' });
  };

  // Find existing config for each server
  const getConfigForServer = (serverName: string): MCPSecurityConfig | undefined => {
    return settings.mcpConfigs.find(c => c.mcpName === serverName);
  };

  // Count guarded MCPs
  const guardedCount = settings.mcpConfigs.filter(c => c.isGuarded).length;

  return (
    <div style={{ padding: '16px', maxWidth: '100%' }}>
      {/* Notifications */}
      <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 1000, maxWidth: '300px' }}>
        {notifications.map(n => (
          <Notification key={n.id} type={n.type} message={n.message} onDismiss={() => dismiss(n.id)} />
        ))}
      </div>

      {/* Header */}
      <Header
        globalEnabled={settings.enabled}
        onGlobalToggle={handleGlobalToggle}
        onRefresh={refresh}
        isLoading={isLoading}
      />

      {/* Stats Bar */}
      {servers.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>{servers.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>MCPs Detected</div>
          </div>
          <div style={{ width: '1px', background: 'var(--border-color)' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)' }}>{guardedCount}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Guarded</div>
          </div>
          <div style={{ width: '1px', background: 'var(--border-color)' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--warning)' }}>{servers.length - guardedCount}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Unguarded</div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <span className="loading-spinner" style={{ width: '32px', height: '32px' }} />
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading MCP servers...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && servers.length === 0 && (
        <EmptyState onImport={handleImport} />
      )}

      {/* MCP Server List */}
      {!isLoading && servers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              MCP Servers
            </h2>
            <Button variant="ghost" size="sm" onClick={handleImport}>
              Re-import from IDE
            </Button>
          </div>
          
          {servers.map(server => (
            <MCPCard
              key={server.name}
              server={server}
              config={getConfigForServer(server.name)}
              onConfigChange={handleConfigChange}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          MCP Guard v0.1.0 · 
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); postMessage({ type: 'openMCPGuardDocs' }); }}
            style={{ color: 'var(--accent)', marginLeft: '4px', textDecoration: 'none' }}
          >
            Documentation
          </a>
        </p>
      </div>
    </div>
  );
};

export default App;


