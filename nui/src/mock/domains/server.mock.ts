/**
 * Mock data and handlers for the Server domain.
 * Covers: announcements, gametype, map name, convars, cleanup, emergency mode.
 */

import type { DomainMock } from '../types'
import { jsonResponse } from '../types'

// ---- Handlers ----

async function handleAnnounce(): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleSetGameType(): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleSetMapName(): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleSetConvar(_body: Record<string, unknown>): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleRequestCleanup(): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleRequestConvars(): Promise<Response> {
  return jsonResponse([
    { key: 'sv_hostname', label: 'Server Hostname', category: 'FiveM: Server', value: 'My Server', setType: 'set' as const },
    { key: 'sv_projectName', label: 'Project Name', category: 'FiveM: Server', value: 'My Community', setType: 'sets' as const },
    { key: 'sv_projectDesc', label: 'Project Description', category: 'FiveM: Server', value: 'A great server', setType: 'sets' as const },
    { key: 'sv_maxClients', label: 'Max Clients', category: 'FiveM: Server', value: '48', setType: 'set' as const },
    { key: 'gametype', label: 'Gametype', category: 'FiveM: Server', value: 'Roleplay', setType: 'set' as const },
    { key: 'mapname', label: 'Map Name', category: 'FiveM: Server', value: 'none', setType: 'set' as const },
    { key: 'onesync', label: 'OneSync', category: 'FiveM: Network', value: 'infinity', setType: 'set' as const },
    { key: 'sv_endpointPrivacy', label: 'Endpoint Privacy', category: 'FiveM: Network', value: 'false', setType: 'set' as const },
    { key: 'sv_stateBagStrictMode', label: 'StateBag Strict Mode', category: 'FiveM: Replicated', value: 'false', setType: 'setr' as const },
    { key: 'sv_pureLevel', label: 'Pure Level', category: 'FiveM: Security', value: '0', setType: 'set' as const },
    { key: 'ea_LanguageName', label: 'Language', category: 'EasyAdmin: General', value: 'en', setType: 'set' as const },
    { key: 'ea_logLevel', label: 'Log Level', category: 'EasyAdmin: General', value: '1', setType: 'set' as const },
    { key: 'ea_enableChat', label: 'Enable Chat', category: 'EasyAdmin: Moderation', value: 'true', setType: 'set' as const },
    { key: 'ea_maxWarnings', label: 'Max Warnings', category: 'EasyAdmin: Moderation', value: '3', setType: 'set' as const },
    { key: 'ea_enableActionHistory', label: 'Enable Action History', category: 'EasyAdmin: History', value: 'true', setType: 'set' as const },
    { key: 'ea_banMessageServerName', label: 'Ban Message Server Name', category: 'EasyAdmin: Ban Message', value: 'EasyAdmin', setType: 'set' as const },
  ])
}

async function handleRequestServerInfo(): Promise<Response> {
  return jsonResponse({
    gametype: 'Roleplay',
    mapname: 'none',
    hostname: 'My Server',
    maxClients: '48',
    projectName: '',
  })
}

async function handleToggleGlobalMute(): Promise<Response> {
  return jsonResponse({ success: true })
}

export const serverMock: DomainMock = {
  handlers: {
    announce: handleAnnounce,
    setGameType: handleSetGameType,
    setMapName: handleSetMapName,
    setConvar: handleSetConvar,
    requestCleanup: handleRequestCleanup,
    requestConvars: handleRequestConvars,
    requestServerInfo: handleRequestServerInfo,
    toggleGlobalMute: handleToggleGlobalMute,
  },
}
