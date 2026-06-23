import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { registerPlugin, _resetRegistry } from './registry'
import { usePluginContributions } from './usePluginContributions'
import type { EasyAdminPlugin, PluginPageProps, PlayerDetailTabProps } from './types'
import type { Permissions } from '../types'

function dummyComponent() {
  return null
}

function makePlugin(overrides: Partial<EasyAdminPlugin> = {}): EasyAdminPlugin {
  return {
    id: 'test-plugin',
    name: 'Test',
    version: '1.0.0',
    navItems: [
      { id: 'plugin:test-plugin', view: 'plugin:test-plugin', label: 'Test', icon: 'box' },
    ],
    pages: [
      { view: 'plugin:test-plugin', component: dummyComponent as React.ComponentType<PluginPageProps> },
    ],
    playerDetailTabs: [
      { id: 'tab1', label: 'Tab', component: dummyComponent as React.ComponentType<PlayerDetailTabProps> },
    ],
    dashboardWidgets: [
      { id: 'w1', component: dummyComponent as React.ComponentType<{ pluginId: string }>, order: 50 },
      { id: 'w2', component: dummyComponent as React.ComponentType<{ pluginId: string }>, order: 10 },
    ],
    ...overrides,
  }
}

function renderContributions(permissions: Permissions) {
  return renderHook((perms: Permissions) => usePluginContributions(perms), {
    initialProps: permissions,
  }).result.current
}

describe('usePluginContributions', () => {
  beforeEach(() => {
    _resetRegistry()
  })

  it('collects all contributions when permissions allow', () => {
    registerPlugin(makePlugin())
    const c = renderContributions({ 'admin.menu': true })

    expect(c.navItems).toHaveLength(1)
    expect(c.pages.size).toBe(1)
    expect(c.playerDetailTabs).toHaveLength(1)
    expect(c.dashboardWidgets).toHaveLength(2)
  })

  it('hides the whole plugin when plugin-level permission is missing', () => {
    registerPlugin(makePlugin({ permission: 'plugin.test' }))
    const c = renderContributions({})

    expect(c.navItems).toHaveLength(0)
    expect(c.pages.size).toBe(0)
    expect(c.playerDetailTabs).toHaveLength(0)
    expect(c.dashboardWidgets).toHaveLength(0)
  })

  it('hides a single player tab when its permission is missing', () => {
    registerPlugin(
      makePlugin({
        playerDetailTabs: [
          { id: 'public', label: 'Public', component: dummyComponent as React.ComponentType<PlayerDetailTabProps> },
          { id: 'private', label: 'Private', permission: 'plugin.test', component: dummyComponent as React.ComponentType<PlayerDetailTabProps> },
        ],
      }),
    )
    const c = renderContributions({ 'admin.menu': true })

    expect(c.playerDetailTabs).toHaveLength(1)
    expect(c.playerDetailTabs[0].id).toBe('test-plugin:public')
  })

  it('sorts dashboard widgets by order', () => {
    registerPlugin(makePlugin())
    const c = renderContributions({ 'admin.menu': true })

    expect(c.dashboardWidgets[0].id).toBe('test-plugin:w2') // order 10
    expect(c.dashboardWidgets[1].id).toBe('test-plugin:w1') // order 50
  })

  it('namespaces player tab and widget ids with the plugin id', () => {
    registerPlugin(makePlugin())
    const c = renderContributions({ 'admin.menu': true })

    expect(c.playerDetailTabs[0].id).toBe('test-plugin:tab1')
    expect(c.dashboardWidgets[0].id).toMatch(/^test-plugin:/)
  })
})
