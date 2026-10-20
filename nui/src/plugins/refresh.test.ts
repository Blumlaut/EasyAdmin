import { describe, expect, it } from 'vitest'
import { matchesRefresh, type PluginRefreshSubscription } from './refresh'

const page: PluginRefreshSubscription = { pluginId: 'p', target: 'page', id: 'plugin:p' }
const widget: PluginRefreshSubscription = { pluginId: 'p', target: 'widget', id: 'status' }
const tab: PluginRefreshSubscription = { pluginId: 'p', target: 'player-tab', id: 'info', playerId: 4 }

describe('refresh address matching', () => {
  it('matches every view of a plugin when the request is unaddressed', () => {
    expect(matchesRefresh({ pluginId: 'p' }, page)).toBe(true)
    expect(matchesRefresh({ pluginId: 'p' }, widget)).toBe(true)
    expect(matchesRefresh({ pluginId: 'p' }, tab)).toBe(true)
  })

  it('narrows to one contribution by target and id', () => {
    expect(matchesRefresh({ pluginId: 'p', target: 'page', id: 'plugin:p' }, page)).toBe(true)
    expect(matchesRefresh({ pluginId: 'p', target: 'page', id: 'plugin:p' }, widget)).toBe(false)
    expect(matchesRefresh({ pluginId: 'p', target: 'widget', id: 'status' }, widget)).toBe(true)
    expect(matchesRefresh({ pluginId: 'p', target: 'widget', id: 'other' }, widget)).toBe(false)
  })

  it('accepts tab as an alias for player-tab', () => {
    expect(matchesRefresh({ pluginId: 'p', target: 'tab', id: 'info' }, tab)).toBe(true)
  })

  it('narrows a tab refresh to one player', () => {
    expect(matchesRefresh({ pluginId: 'p', target: 'tab', id: 'info', playerId: 4 }, tab)).toBe(true)
    expect(matchesRefresh({ pluginId: 'p', target: 'tab', id: 'info', playerId: 9 }, tab)).toBe(false)
  })

  it('never matches another plugin', () => {
    expect(matchesRefresh({ pluginId: 'q' }, page)).toBe(false)
    expect(matchesRefresh({ pluginId: 'q', target: 'page', id: 'plugin:p' }, page)).toBe(false)
  })

  it('does not match a view that has no player against a player-addressed request', () => {
    expect(matchesRefresh({ pluginId: 'p', playerId: 4 }, page)).toBe(false)
  })
})
