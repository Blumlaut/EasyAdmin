/**
 * Mock data and handlers for the runtime plugin system.
 *
 * Intercepts the `pluginCall` NUI callback so plugins work in browser
 * dev mode (?dev). Simulates an external plugin registering and returning
 * schema trees.
 */

import type { DomainMock } from '../types'
import { jsonResponse } from '../types'

// ---- Mock plugin registration (sent on load) ----

const MOCK_PLUGIN = {
  id: 'easyinfo',
  name: 'EasyInfo',
  version: '1.0.0',
  icon: 'info',
  navItems: [
    { id: 'plugin:easyinfo', label: 'Server Info', icon: 'info' },
  ],
  pages: [
    { view: 'plugin:easyinfo', renderAction: 'renderPage' },
  ],
  playerDetailTabs: [
    { id: 'notes', label: 'Plugin Notes', icon: 'book-open', renderAction: 'renderTab' },
  ],
  dashboardWidgets: [
    { id: 'status', renderAction: 'renderWidget', order: 150 },
  ],
}

// Push the mock plugin registration after a short delay (simulates runtime registration)
setTimeout(() => {
  window.postMessage({
    action: 'pluginRegistered',
    data: MOCK_PLUGIN,
  }, '*')
}, 100)

// ---- Schema responses for mock plugin actions ----

function handlePluginCall(body: Record<string, unknown>): Promise<Response> {
  const pluginId = body.pluginId as string
  const action = body.action as string
  const server = body.server === true

  // ── Render: page ──────────────────────────────────
  if (pluginId === 'easyinfo' && action === 'renderPage') {
    return Promise.resolve(jsonResponse([
      { type: 'heading', text: 'Server Info', level: 2 },
      {
        type: 'row', gap: 3, children: [
          { type: 'stat-card', label: 'Players', value: '8', icon: 'users', iconColor: 'var(--accent-green)', bgColor: 'var(--bg-green)' },
          { type: 'stat-card', label: 'Uptime', value: '1h 0m', icon: 'clock', iconColor: 'var(--accent-blue)', bgColor: 'var(--bg-blue)' },
          { type: 'stat-card', label: 'FPS', value: '60', icon: 'gauge', iconColor: 'var(--accent-orange)', bgColor: 'var(--bg-orange)' },
        ],
      },
      {
        type: 'card', children: [
          { type: 'heading', text: 'Quick Actions', level: 4 },
          {
            type: 'row', gap: 2, wrap: true, children: [
              { type: 'button', label: 'Refresh', action: 'refresh', icon: 'refresh', variant: 'ghost', size: 'sm' },
              { type: 'button', label: 'Notify', action: 'notify', icon: 'info', variant: 'ghost', size: 'sm' },
            ],
          },
        ],
      },
    ]))
  }

  // ── Render: player tab ────────────────────────────
  if (pluginId === 'easyinfo' && action === 'renderTab') {
    return Promise.resolve(jsonResponse([
      {
        type: 'timeline-entry', title: 'Plugin Note', time: '10 min ago', footer: 'Mock Admin', children: [
          { type: 'text', text: 'This is a mock note from the EasyInfo plugin.' },
        ],
      },
      {
        type: 'timeline-entry', title: 'Warning', time: '1 day ago', footer: 'Mock Mod', children: [
          { type: 'text', text: 'Player has been warned previously for RDM.', variant: 'muted' },
        ],
      },
    ]))
  }

  // ── Render: dashboard widget ──────────────────────
  if (pluginId === 'easyinfo' && action === 'renderWidget') {
    return Promise.resolve(jsonResponse([
      {
        type: 'card', children: [
          {
            type: 'row', gap: 2, children: [
              { type: 'icon', name: 'check-circle', size: 'md' },
              { type: 'col', gap: 0, children: [
                { type: 'text', text: 'EasyInfo Online', variant: 'small' },
                { type: 'text', text: 'Latency: 12ms', variant: 'muted' },
              ]},
            ],
          },
        ],
      },
    ]))
  }

  // ── Action: refresh (returns new schema) ──────────
  if (pluginId === 'easyinfo' && action === 'refresh') {
    return Promise.resolve(jsonResponse([
      { type: 'heading', text: 'Server Info', level: 2 },
      { type: 'badge', text: 'Refreshed!', variant: 'online' },
      {
        type: 'row', gap: 3, children: [
          { type: 'stat-card', label: 'Players', value: String(8 + Math.floor(Math.random() * 3)), icon: 'users', iconColor: 'var(--accent-green)', bgColor: 'var(--bg-green)' },
        ],
      },
    ]))
  }

  // ── Action: notify ────────────────────────────────
  if (pluginId === 'easyinfo' && action === 'notify') {
    return Promise.resolve(jsonResponse({ ok: true }))
  }

  // ── Server-side handler demo ──────────────────────
  if (pluginId === 'easyinfo' && action === 'getPlayerCount' && server) {
    return Promise.resolve(jsonResponse({ ok: true, count: 8, requestedBy: 1 }))
  }

  console.warn('[mock] Unknown pluginCall:', pluginId, action)
  return Promise.resolve(jsonResponse({ ok: false, error: 'unknown plugin action' }))
}

export const pluginsMock: DomainMock = {
  handlers: {
    pluginCall: handlePluginCall,
  },
}
