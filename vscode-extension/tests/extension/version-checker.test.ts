/**
 * Unit tests for version-checker module
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  compareVersions,
  extractPackageInfo,
  extractPackageName,
  getVersionStatusColor,
  isNpxCommand,
  isVersionStale,
  type VersionStatus,
} from '../../src/extension/version-checker'

describe('version-checker', () => {
  describe('extractPackageInfo', () => {
    it('should extract package name without version', () => {
      expect(extractPackageInfo(['-y', 'my-package'])).toEqual({
        packageName: 'my-package',
      })
      expect(extractPackageInfo(['my-package'])).toEqual({
        packageName: 'my-package',
      })
    })

    it('should extract package name with pinned version', () => {
      expect(extractPackageInfo(['-y', 'my-package@1.2.3'])).toEqual({
        packageName: 'my-package',
        pinnedVersion: '1.2.3',
      })
      expect(extractPackageInfo(['my-package@0.9.0'])).toEqual({
        packageName: 'my-package',
        pinnedVersion: '0.9.0',
      })
    })

    it('should handle scoped packages without version', () => {
      expect(extractPackageInfo(['-y', '@scope/package'])).toEqual({
        packageName: '@scope/package',
      })
      expect(
        extractPackageInfo(['-y', '@modelcontextprotocol/server-github']),
      ).toEqual({
        packageName: '@modelcontextprotocol/server-github',
      })
    })

    it('should handle scoped packages with pinned version', () => {
      expect(extractPackageInfo(['-y', '@scope/package@1.2.3'])).toEqual({
        packageName: '@scope/package',
        pinnedVersion: '1.2.3',
      })
      expect(
        extractPackageInfo(['-y', '@modelcontextprotocol/server-github@0.1.0']),
      ).toEqual({
        packageName: '@modelcontextprotocol/server-github',
        pinnedVersion: '0.1.0',
      })
    })

    it('should skip flags and find first non-flag arg', () => {
      expect(
        extractPackageInfo(['-y', '--no-install', '@scope/package@2.0.0']),
      ).toEqual({
        packageName: '@scope/package',
        pinnedVersion: '2.0.0',
      })
    })

    it('should return null for empty or invalid args', () => {
      expect(extractPackageInfo([])).toBeNull()
      expect(extractPackageInfo(undefined)).toBeNull()
      expect(extractPackageInfo(['-y'])).toBeNull()
    })
  })

  describe('extractPackageName (legacy)', () => {
    it('should extract package name from npx args', () => {
      expect(
        extractPackageName(['-y', '@modelcontextprotocol/server-github']),
      ).toBe('@modelcontextprotocol/server-github')
      expect(extractPackageName(['@modelcontextprotocol/server-github'])).toBe(
        '@modelcontextprotocol/server-github',
      )
      expect(extractPackageName(['my-package'])).toBe('my-package')
    })

    it('should handle scoped packages', () => {
      expect(extractPackageName(['-y', '@scope/package'])).toBe(
        '@scope/package',
      )
    })

    it('should skip flags and find first non-flag arg', () => {
      expect(extractPackageName(['-y', '--no-install', '@scope/package'])).toBe(
        '@scope/package',
      )
    })

    it('should return null for empty or invalid args', () => {
      expect(extractPackageName([])).toBeNull()
      expect(extractPackageName(undefined)).toBeNull()
      expect(extractPackageName(['-y'])).toBeNull()
    })
  })

  describe('isNpxCommand', () => {
    it('should detect npx command', () => {
      expect(isNpxCommand('npx')).toBe(true)
      expect(isNpxCommand('npx.cmd')).toBe(true)
      expect(isNpxCommand('C:\\Users\\user\\node_modules\\.bin\\npx.cmd')).toBe(
        true,
      )
    })

    it('should return false for non-npx commands', () => {
      expect(isNpxCommand('node')).toBe(false)
      expect(isNpxCommand('python')).toBe(false)
      expect(isNpxCommand(undefined)).toBe(false)
      expect(isNpxCommand('')).toBe(false)
    })
  })

  describe('isVersionStale', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    it('should return true if no lastChecked', () => {
      expect(isVersionStale(undefined)).toBe(true)
    })

    it('should return true if older than 24 hours', () => {
      const now = new Date('2025-01-02T12:00:00Z')
      vi.setSystemTime(now)

      const yesterday = new Date('2025-01-01T11:00:00Z').toISOString()
      expect(isVersionStale(yesterday)).toBe(true)
    })

    it('should return false if within 24 hours', () => {
      const now = new Date('2025-01-02T12:00:00Z')
      vi.setSystemTime(now)

      const recent = new Date('2025-01-02T01:00:00Z').toISOString()
      expect(isVersionStale(recent)).toBe(false)
    })
  })

  describe('compareVersions', () => {
    it('should detect up-to-date versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe('up-to-date')
      expect(compareVersions('v2.5.3', 'v2.5.3')).toBe('up-to-date')
    })

    it('should detect minor/patch behind', () => {
      expect(compareVersions('1.0.0', '1.1.0')).toBe('minor-behind')
      expect(compareVersions('1.0.0', '1.0.1')).toBe('minor-behind')
      expect(compareVersions('2.5.3', '2.6.0')).toBe('minor-behind')
    })

    it('should detect major version behind', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe('major-behind')
      expect(compareVersions('0.9.5', '1.0.0')).toBe('major-behind')
    })

    it('should handle v prefix in versions', () => {
      expect(compareVersions('v1.0.0', '2.0.0')).toBe('major-behind')
      expect(compareVersions('1.0.0', 'v2.0.0')).toBe('major-behind')
      expect(compareVersions('v1.0.0', 'v1.1.0')).toBe('minor-behind')
    })

    it('should return unknown for invalid versions', () => {
      expect(compareVersions(undefined, '1.0.0')).toBe('unknown')
      expect(compareVersions('1.0.0', undefined)).toBe('unknown')
      expect(compareVersions(undefined, undefined)).toBe('unknown')
    })
  })

  describe('getVersionStatusColor', () => {
    it('should return correct colors for each status', () => {
      expect(getVersionStatusColor('up-to-date')).toBe('#22c55e') // Green
      expect(getVersionStatusColor('minor-behind')).toBe('#eab308') // Yellow
      expect(getVersionStatusColor('major-behind')).toBe('#ef4444') // Red
      expect(getVersionStatusColor('unknown')).toBe('#6b7280') // Gray
    })
  })

  // Integration-style tests would go here but require mocking child_process and fetch
  // These are better tested in integration tests or manual testing
})


