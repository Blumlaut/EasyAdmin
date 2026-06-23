import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerPlugin,
  getRegisteredPlugins,
  getPluginErrors,
  _resetRegistry,
} from './registry'
import type { EasyAdminPlugin } from './types'

function makePlugin(overrides: Partial<EasyAdminPlugin> = {}): EasyAdminPlugin {
  return {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    ...overrides,
  }
}

describe('plugin registry', () => {
  beforeEach(() => {
    _resetRegistry()
  })

  it('registers a valid plugin', () => {
    registerPlugin(makePlugin())
    expect(getRegisteredPlugins()).toHaveLength(1)
    expect(getRegisteredPlugins()[0].id).toBe('test-plugin')
  })

  it('rejects a plugin without an id', () => {
    registerPlugin(makePlugin({ id: '' }))
    expect(getRegisteredPlugins()).toHaveLength(0)
    expect(getPluginErrors()).toHaveLength(1)
    expect(getPluginErrors()[0].error).toMatch(/id/)
  })

  it('rejects a non-kebab-case id', () => {
    registerPlugin(makePlugin({ id: 'BadID' }))
    expect(getRegisteredPlugins()).toHaveLength(0)
    expect(getPluginErrors()[0].error).toMatch(/kebab-case/)
  })

  it('rejects a plugin without a name', () => {
    registerPlugin(makePlugin({ name: '' }))
    expect(getRegisteredPlugins()).toHaveLength(0)
  })

  it('rejects a plugin without a version', () => {
    registerPlugin(makePlugin({ version: '' }))
    expect(getRegisteredPlugins()).toHaveLength(0)
  })

  it('ignores duplicate plugin ids', () => {
    registerPlugin(makePlugin())
    registerPlugin(makePlugin())
    expect(getRegisteredPlugins()).toHaveLength(1)
  })

  it('registers multiple distinct plugins', () => {
    registerPlugin(makePlugin({ id: 'one' }))
    registerPlugin(makePlugin({ id: 'two' }))
    expect(getRegisteredPlugins()).toHaveLength(2)
  })

  it('accepts an empty plugin with only required fields', () => {
    registerPlugin(makePlugin())
    const plugin = getRegisteredPlugins()[0]
    expect(plugin.navItems).toBeUndefined()
    expect(plugin.pages).toBeUndefined()
    expect(plugin.onActivate).toBeUndefined()
  })
})
