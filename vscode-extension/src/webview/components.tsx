/**
 * React components for the MCP Guard webview UI
 */

import React, { useState, useCallback } from 'react';
import type { MCPSecurityConfig, MCPServerInfo, MCPGuardSettings } from './types';
import { DEFAULT_SECURITY_CONFIG } from './types';

// ====================
// Utility Components
// ====================

interface IconProps {
  size?: number;
  className?: string;
}

export const ShieldIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

// Logo version with gradient - for header and empty state
export const ShieldLogo: React.FC<IconProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
    <defs>
      <linearGradient id="shieldMainLogo" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#4ade80' }} />
        <stop offset="45%" style={{ stopColor: '#22c55e' }} />
        <stop offset="100%" style={{ stopColor: '#16a34a' }} />
      </linearGradient>
      <linearGradient id="shieldEdgeLogo" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#15803d' }} />
        <stop offset="100%" style={{ stopColor: '#166534' }} />
      </linearGradient>
    </defs>
    {/* Subtle shadow */}
    <path d="M64 12L112 26V54C112 84 90 106 64 117C38 106 16 84 16 54V26L64 12Z" 
          fill="#0f172a" 
          opacity="0.15"
          transform="translate(2, 3)"/>
    {/* Main shield */}
    <path d="M64 10L114 25V54C114 85 91 108 64 119C37 108 14 85 14 54V25L64 10Z" 
          fill="url(#shieldMainLogo)"/>
    {/* Left highlight */}
    <path d="M64 10L14 25V54C14 85 37 108 64 119L64 10Z" 
          fill="white" 
          opacity="0.15"/>
    {/* Right shadow */}
    <path d="M64 10L114 25V54C114 85 91 108 64 119L64 10Z" 
          fill="url(#shieldEdgeLogo)" 
          opacity="0.25"/>
    {/* Border */}
    <path d="M64 10L114 25V54C114 85 91 108 64 119C37 108 14 85 14 54V25L64 10Z" 
          fill="none" 
          stroke="#15803d" 
          strokeWidth="2"/>
    {/* White checkmark */}
    <path d="M46 62L58 74L82 50" 
          stroke="white" 
          strokeWidth="10" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"/>
  </svg>
);

export const NetworkIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const FolderIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const RefreshIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const AlertIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// Shield with X - for unguarded state
export const ShieldOffIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="9" y1="9" x2="15" y2="15" />
    <line x1="15" y1="9" x2="9" y2="15" />
  </svg>
);

// ====================
// UI Components
// ====================

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  description?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ enabled, onChange, label, description }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }} onClick={() => onChange(!enabled)}>
    <div
      style={{
        width: '40px',
        height: '22px',
        borderRadius: '11px',
        background: enabled ? '#22c55e' : 'var(--bg-hover)',
        position: 'relative',
        transition: 'background 0.2s ease',
        flexShrink: 0,
        marginTop: '2px',
      }}
    >
      <div
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: enabled ? 'white' : 'var(--text-muted)',
          position: 'absolute',
          top: '2px',
          left: enabled ? '20px' : '2px',
          transition: 'all 0.2s ease',
        }}
      />
    </div>
    {(label || description) && (
      <div style={{ flex: 1 }}>
        {label && <div style={{ fontWeight: 500 }}>{label}</div>}
        {description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{description}</div>}
      </div>
    )}
  </div>
);

interface ButtonProps {
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  disabled?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({ onClick, variant = 'secondary', size = 'md', disabled, children, style }) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: size === 'sm' ? '4px 8px' : '8px 16px',
    fontSize: size === 'sm' ? '12px' : '13px',
    fontWeight: 500,
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s ease',
    ...style,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: '#22c55e', color: 'white' },
    secondary: { background: 'var(--bg-hover)', color: 'var(--text-primary)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)' },
    danger: { background: 'var(--error)', color: 'white' },
  };

  return (
    <button style={{ ...baseStyle, ...variants[variant] }} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
  style?: React.CSSProperties;
}

export const Input: React.FC<InputProps> = ({ value, onChange, placeholder, type = 'text', style }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      width: '100%',
      padding: '8px 12px',
      fontSize: '13px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border-color)',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      outline: 'none',
      ...style,
    }}
  />
);

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({ tags, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        onChange([...tags, inputValue.trim()]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        padding: '8px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-primary)',
        minHeight: '40px',
      }}
    >
      {tags.map((tag, index) => (
        <span
          key={index}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            fontSize: '12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-hover)',
            color: 'var(--text-primary)',
          }}
        >
          {tag}
          <span
            onClick={() => removeTag(index)}
            style={{ cursor: 'pointer', opacity: 0.7, marginLeft: '2px' }}
          >
            ×
          </span>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        style={{
          flex: 1,
          minWidth: '100px',
          padding: '2px 4px',
          fontSize: '13px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-primary)',
          outline: 'none',
        }}
      />
    </div>
  );
};

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          background: 'var(--bg-secondary)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {icon}
        <span style={{ flex: 1, fontWeight: 500 }}>{title}</span>
        <ChevronDownIcon
          size={16}
          className={undefined}
        />
      </div>
      {isOpen && (
        <div style={{ padding: '16px', background: 'var(--bg-primary)' }} className="animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

// ====================
// MCP Configuration Components
// ====================

interface MCPCardProps {
  server: MCPServerInfo;
  config?: MCPSecurityConfig;
  onConfigChange: (config: MCPSecurityConfig) => void;
  currentIDE?: string; // The IDE we're currently running in
}

export const MCPCard: React.FC<MCPCardProps> = ({ server, config, onConfigChange, currentIDE = 'cursor' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Initialize config if not exists
  const currentConfig: MCPSecurityConfig = config || {
    id: `config-${server.name}`,
    mcpName: server.name,
    isGuarded: false,
    ...DEFAULT_SECURITY_CONFIG,
    lastModified: new Date().toISOString(),
  };

  const updateConfig = useCallback((updates: Partial<MCPSecurityConfig>) => {
    onConfigChange({
      ...currentConfig,
      ...updates,
      lastModified: new Date().toISOString(),
    });
  }, [currentConfig, onConfigChange]);

  const sourceColors: Record<string, string> = {
    claude: '#cc7832',
    copilot: '#6e5494',
    cursor: '#00d1b2',
    unknown: 'var(--text-muted)',
  };

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${currentConfig.isGuarded ? '#22c55e' : 'var(--border-color)'}`,
        background: 'var(--bg-secondary)',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
      }}
      className="animate-slide-in"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            background: currentConfig.isGuarded ? '#22c55e' : 'rgba(234, 179, 8, 0.15)',
            color: currentConfig.isGuarded ? 'white' : '#eab308',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          {currentConfig.isGuarded ? <ShieldIcon size={18} /> : <ShieldOffIcon size={18} />}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600 }}>{server.name}</span>
            {/* Only show source tag if from a different IDE */}
            {server.source !== currentIDE && (
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  background: sourceColors[server.source] || sourceColors.unknown,
                  color: 'white',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                {server.source}
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {server.command ? `${server.command} ${(server.args || []).slice(0, 2).join(' ')}...` : server.url || 'No command'}
          </div>
        </div>

        {/* Guard Toggle */}
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 500, 
            color: currentConfig.isGuarded ? 'var(--success)' : 'var(--text-secondary)' 
          }}>
            {currentConfig.isGuarded ? 'Unguard' : 'Guard'}
          </span>
          <div
            onClick={() => updateConfig({ isGuarded: !currentConfig.isGuarded })}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              background: currentConfig.isGuarded ? '#22c55e' : 'var(--bg-hover)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
              border: currentConfig.isGuarded ? 'none' : '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: currentConfig.isGuarded ? 'white' : 'var(--text-muted)',
                position: 'absolute',
                top: '2px',
                left: currentConfig.isGuarded ? '22px' : '2px',
                transition: 'all 0.2s ease',
                boxShadow: currentConfig.isGuarded ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
              }}
            />
          </div>
        </div>
        
        <ChevronDownIcon
          size={16}
          className={undefined}
        />
      </div>

      {/* Expanded Configuration */}
      {isExpanded && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
          {/* Network Configuration */}
          <CollapsibleSection
            title="Network Access"
            icon={<NetworkIcon size={16} />}
            defaultOpen={currentConfig.network.enabled}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Toggle
                enabled={currentConfig.network.enabled}
                onChange={(enabled) => updateConfig({
                  network: { ...currentConfig.network, enabled }
                })}
                label="Enable Network Access"
                description="Allow this MCP to make outbound network requests"
              />
              
              {currentConfig.network.enabled && (
                <>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                      Allowed Hosts
                    </label>
                    <TagInput
                      tags={currentConfig.network.allowlist}
                      onChange={(allowlist) => updateConfig({
                        network: { ...currentConfig.network, allowlist }
                      })}
                      placeholder="Enter domain and press Enter (e.g., api.github.com)"
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Only these hosts will be accessible. Leave empty to block all external requests.
                    </div>
                  </div>
                  
                  <Toggle
                    enabled={currentConfig.network.allowLocalhost}
                    onChange={(allowLocalhost) => updateConfig({
                      network: { ...currentConfig.network, allowLocalhost }
                    })}
                    label="Allow Localhost"
                    description="Permit requests to localhost and 127.0.0.1"
                  />
                </>
              )}
            </div>
          </CollapsibleSection>

          {/* File System Configuration */}
          <CollapsibleSection
            title="File System Access"
            icon={<FolderIcon size={16} />}
            defaultOpen={currentConfig.fileSystem.enabled}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Toggle
                enabled={currentConfig.fileSystem.enabled}
                onChange={(enabled) => updateConfig({
                  fileSystem: { ...currentConfig.fileSystem, enabled }
                })}
                label="Enable File System Access"
                description="Allow this MCP to access the file system"
              />
              
              {currentConfig.fileSystem.enabled && (
                <>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                      Read Paths
                    </label>
                    <TagInput
                      tags={currentConfig.fileSystem.readPaths}
                      onChange={(readPaths) => updateConfig({
                        fileSystem: { ...currentConfig.fileSystem, readPaths }
                      })}
                      placeholder="Enter path and press Enter (e.g., /home/user/projects)"
                    />
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                      Write Paths
                    </label>
                    <TagInput
                      tags={currentConfig.fileSystem.writePaths}
                      onChange={(writePaths) => updateConfig({
                        fileSystem: { ...currentConfig.fileSystem, writePaths }
                      })}
                      placeholder="Enter path and press Enter (e.g., /tmp)"
                    />
                    <div style={{ fontSize: '11px', color: 'var(--warning)', marginTop: '4px' }}>
                      ⚠️ Write access should be granted carefully
                    </div>
                  </div>
                </>
              )}
            </div>
          </CollapsibleSection>

          {/* Resource Limits */}
          <CollapsibleSection
            title="Resource Limits"
            icon={<ClockIcon size={16} />}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                  Max Execution Time (ms)
                </label>
                <Input
                  type="number"
                  value={currentConfig.resourceLimits.maxExecutionTimeMs.toString()}
                  onChange={(value) => updateConfig({
                    resourceLimits: { ...currentConfig.resourceLimits, maxExecutionTimeMs: parseInt(value) || 30000 }
                  })}
                  placeholder="30000"
                />
              </div>
              
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                  Max Memory (MB)
                </label>
                <Input
                  type="number"
                  value={currentConfig.resourceLimits.maxMemoryMB.toString()}
                  onChange={(value) => updateConfig({
                    resourceLimits: { ...currentConfig.resourceLimits, maxMemoryMB: parseInt(value) || 128 }
                  })}
                  placeholder="128"
                />
              </div>
              
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                  Max MCP Calls per Execution
                </label>
                <Input
                  type="number"
                  value={currentConfig.resourceLimits.maxMCPCalls.toString()}
                  onChange={(value) => updateConfig({
                    resourceLimits: { ...currentConfig.resourceLimits, maxMCPCalls: parseInt(value) || 100 }
                  })}
                  placeholder="100"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button variant="primary" onClick={() => onConfigChange(currentConfig)}>
              <CheckIcon size={14} />
              Save Configuration
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ====================
// Notification Component
// ====================

interface NotificationProps {
  type: 'success' | 'error';
  message: string;
  onDismiss: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ type, message, onDismiss }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 14px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--bg-secondary)',
      border: `1px solid ${type === 'success' ? '#22c55e' : 'var(--error)'}`,
      color: type === 'success' ? '#22c55e' : 'var(--error)',
      fontSize: '12px',
      marginBottom: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}
    className="animate-fade-in"
  >
    {type === 'success' ? <CheckIcon size={14} /> : <AlertIcon size={14} />}
    <span style={{ flex: 1, color: 'var(--text-primary)' }}>{message}</span>
    <span onClick={onDismiss} style={{ cursor: 'pointer', opacity: 0.5, fontSize: '16px' }}>×</span>
  </div>
);

// ====================
// Header Component
// ====================

interface HeaderProps {
  globalEnabled: boolean;
  onGlobalToggle: (enabled: boolean) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ globalEnabled, onGlobalToggle, onRefresh, isLoading }) => (
  <div style={{ marginBottom: '24px' }}>
    {/* Logo and Title */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
      <ShieldLogo size={48} />
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>MCP Guard</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
          Secure isolation for MCP servers
        </p>
      </div>
    </div>

    {/* Global Toggle and Actions */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <Toggle
        enabled={globalEnabled}
        onChange={onGlobalToggle}
        label="MCP Guard Enabled"
      />
      
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
          {isLoading ? <span className="loading-spinner" /> : <RefreshIcon size={14} />}
          Refresh
        </Button>
      </div>
    </div>
  </div>
);

// ====================
// Empty State Component
// ====================

export const EmptyState: React.FC<{ onImport: () => void }> = ({ onImport }) => (
  <div
    style={{
      textAlign: 'center',
      padding: '48px 24px',
      borderRadius: 'var(--radius-lg)',
      border: '2px dashed var(--border-color)',
      background: 'var(--bg-secondary)',
    }}
  >
    <div style={{ marginBottom: '8px' }}>
      <ShieldLogo size={72} />
    </div>
    <h3 style={{ margin: '16px 0 8px', fontWeight: 600 }}>No MCP Servers Found</h3>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
      Import MCP servers from your IDE configuration to get started.
    </p>
    <Button variant="primary" onClick={onImport}>
      <PlusIcon size={14} />
      Import from IDE Config
    </Button>
  </div>
);


