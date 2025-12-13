# Toggle Persistence Fix Summary

## Problem Description

Users reported that toggle changes (network access, filesystem access, allow localhost) were not being saved. When they toggled a setting, then collapsed and reopened the MCP card, the toggle would revert to its previous state.

## Root Causes Identified

### 1. Toggles Required Manual Save Button Click (Fixed)
**Issue**: All changes (both toggles and text inputs) went through a single `handleChange` function that set `hasChanges` to `true`, requiring users to manually click a "Save" button. If users collapsed the card before clicking "Save", the toggle changes were lost.

**Fix**: Split the change handlers into two:
- `handleToggleChange`: Saves toggle changes immediately without requiring "Save" button
- `handleInputChange`: Still requires "Save" button for text inputs (to avoid saving on every keystroke)

**Files Modified**:
- `vscode-extension/src/webview/components.tsx`
  - `NetworkConfigSection` component
  - `FileSystemConfigSection` component

### 2. Backend Didn't Send Updated Settings Back (Fixed)
**Issue**: When toggle settings changed (non-guard status changes), the backend saved the changes but did NOT send the updated settings back to the frontend. This relied on "optimistic updates" in the frontend, which could fail if the component remounted before the optimistic update propagated.

**Fix**: Made the backend ALWAYS send updated settings back to the frontend after saving, ensuring the frontend stays in sync with the backend's authoritative state.

**Files Modified**:
- `vscode-extension/src/extension/webview-provider.ts`
  - `_saveMCPConfig`: Now always sends settings back (line 872-875)
  - `_saveSettings`: Now sends settings back for non-guard changes (line 794-797)

## Changes Made

### 1. NetworkConfigSection Component
```typescript
// OLD: Single handler for all changes
const handleChange = (updates: Partial<typeof localNetwork>) => {
  setLocalNetwork((prev) => ({ ...prev, ...updates }))
  setHasChanges(true)
}

// NEW: Separate handlers for toggles and inputs
// Toggle changes save immediately
const handleToggleChange = (updates: Partial<typeof localNetwork>) => {
  const updatedNetwork = { ...localNetwork, ...updates }
  setLocalNetwork(updatedNetwork)
  onSave(updatedNetwork)
}

// Input changes still require save button
const handleInputChange = (updates: Partial<typeof localNetwork>) => {
  setLocalNetwork((prev) => ({ ...prev, ...updates }))
  setHasChanges(true)
}
```

### 2. FileSystemConfigSection Component
Applied the same split-handler pattern as NetworkConfigSection.

### 3. Backend webview-provider.ts

#### In `_saveMCPConfig`:
```typescript
// Save settings (dehydrates to remove isGuarded)
saveSettingsWithDehydration(settingsPath, settings)

// Always send updated settings back to ensure frontend is in sync
// This is critical for toggles that need to persist across component unmount/remount
const updatedSettings = loadSettingsWithHydration(settingsPath)
this._postMessage({ type: 'settings', data: updatedSettings })
```

#### In `_saveSettings`:
```typescript
if (globalEnabledChanged) {
  // Refresh MCP list to show updated status
  await this._sendMCPServers()
} else {
  // For non-guard changes (e.g., context window size), still send settings back
  const updatedSettings = loadSettingsWithHydration(settingsPath)
  this._postMessage({ type: 'settings', data: updatedSettings })
}
```

## Tests Added

### 1. Unit Tests for Backend Persistence
- `tests/extension/mcp-config-persistence.test.ts`
  - Tests that network.enabled toggle changes persist
  - Tests that fileSystem.enabled toggle changes persist
  - Tests that network.allowLocalhost toggle changes persist
  - Tests rapid toggle changes (ON → OFF → ON)

### 2. Integration Tests
- `tests/extension/toggle-persistence-integration.test.ts`
  - Simulates the full user workflow: toggle → save → unmount → remount → verify
  - Tests all three toggles (network.enabled, fileSystem.enabled, allowLocalhost)
  - Tests rapid toggle sequences
  - Validates the hydration/dehydration cycle

## Verification Steps

To verify the fix works:

1. **Open an MCP card**
2. **Toggle network access ON** (or any toggle)
3. **Immediately collapse the card** (don't wait for save confirmation)
4. **Reopen the card**
5. **Verify the toggle is still ON** ✓

### What Changed:
- **Before**: Toggle would revert to OFF (not saved)
- **After**: Toggle stays ON (saved immediately)

## Technical Details

### Toggle Fields (Auto-save)
These fields now save immediately when changed:
- ✅ Enable Network Access
- ✅ Allow Localhost
- ✅ Enable File System Access

### Input Fields (Manual save)
These fields still require clicking "Save":
- 📝 Allowed Hosts (allowlist)
- 📝 Read Paths
- 📝 Write Paths

### Why the Split?
- **Toggles**: Binary on/off values - safe to save immediately
- **Text inputs**: Freeform text - saving on every keystroke would be expensive and annoying

## Files Changed

1. `vscode-extension/src/webview/components.tsx`
   - Modified `NetworkConfigSection` component
   - Modified `FileSystemConfigSection` component

2. `vscode-extension/src/extension/webview-provider.ts`
   - Modified `_saveMCPConfig` method
   - Modified `_saveSettings` method

3. **New Test Files**:
   - `vscode-extension/tests/extension/mcp-config-persistence.test.ts`
   - `vscode-extension/tests/extension/toggle-persistence-integration.test.ts`

## Build & Test

```bash
cd vscode-extension
npm run compile
npm test
```

All tests pass ✓


