/**
 * Main App component for MCP Guard webview
 */

import React from 'react';
import { useSettings, useMCPServers, useNotifications, postMessage } from './hooks';
import { Header, MCPCard, EmptyState, Notification, Button, ShieldIcon, ShieldOffIcon } from './components';
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

  // Check if a server is guarded
  const isServerGuarded = (serverName: string): boolean => {
    const config = getConfigForServer(serverName);
    return config?.isGuarded ?? false;
  };

  // Split servers into guarded and unguarded
  const guardedServers = servers.filter(s => isServerGuarded(s.name));
  const unguardedServers = servers.filter(s => !isServerGuarded(s.name));

  return (
    <div style={{ padding: '16px', maxWidth: '100%' }}>
      {/* Notifications - Bottom positioned */}
      <div style={{ position: 'fixed', bottom: '16px', left: '16px', right: '16px', zIndex: 1000 }}>
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

      {/* Status Summary */}
      {servers.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          {/* Unguarded - Primary focus */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: unguardedServers.length > 0 
                ? 'rgba(234, 179, 8, 0.1)' 
                : 'var(--bg-secondary)',
              border: unguardedServers.length > 0 
                ? '1px solid rgba(234, 179, 8, 0.3)' 
                : '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldOffIcon size={16} className={undefined} />
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 600, 
                color: unguardedServers.length > 0 ? 'var(--warning)' : 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Unguarded
              </span>
              <span style={{ 
                marginLeft: 'auto',
                fontSize: '18px', 
                fontWeight: 700, 
                color: unguardedServers.length > 0 ? 'var(--warning)' : 'var(--text-muted)'
              }}>
                {unguardedServers.length}
              </span>
            </div>
            {unguardedServers.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {unguardedServers.map(s => (
                  <span
                    key={s.name}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(234, 179, 8, 0.15)',
                      color: 'var(--warning)',
                      fontWeight: 500,
                    }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                All MCPs protected ✓
              </div>
            )}
          </div>

          {/* Guarded */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: guardedServers.length > 0 
                ? 'rgba(34, 197, 94, 0.1)' 
                : 'var(--bg-secondary)',
              border: guardedServers.length > 0 
                ? '1px solid rgba(34, 197, 94, 0.3)' 
                : '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldIcon size={16} className={undefined} />
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 600, 
                color: guardedServers.length > 0 ? 'var(--success)' : 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Guarded
              </span>
              <span style={{ 
                marginLeft: 'auto',
                fontSize: '18px', 
                fontWeight: 700, 
                color: guardedServers.length > 0 ? 'var(--success)' : 'var(--text-muted)'
              }}>
                {guardedServers.length}
              </span>
            </div>
            {guardedServers.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {guardedServers.map(s => (
                  <span
                    key={s.name}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: 'var(--success)',
                      fontWeight: 500,
                    }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                No MCPs guarded yet
              </div>
            )}
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

      {/* Unguarded Section - Show First (Priority) */}
      {!isLoading && unguardedServers.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ 
              fontSize: '13px', 
              fontWeight: 600, 
              color: 'var(--warning)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ShieldOffIcon size={14} className={undefined} />
              Unguarded MCPs
            </h2>
            <Button variant="ghost" size="sm" onClick={handleImport}>
              Re-import
            </Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {unguardedServers.map(server => (
              <MCPCard
                key={server.name}
                server={server}
                config={getConfigForServer(server.name)}
                onConfigChange={handleConfigChange}
                currentIDE="cursor"
              />
            ))}
          </div>
        </div>
      )}

      {/* Guarded Section */}
      {!isLoading && guardedServers.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '13px', 
            fontWeight: 600, 
            color: 'var(--success)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ShieldIcon size={14} className={undefined} />
            Guarded MCPs
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {guardedServers.map(server => (
              <MCPCard
                key={server.name}
                server={server}
                config={getConfigForServer(server.name)}
                onConfigChange={handleConfigChange}
                currentIDE="cursor"
              />
            ))}
          </div>
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


