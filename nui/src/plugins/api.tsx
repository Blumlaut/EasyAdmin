/**
 * EasyAdmin NUI Plugin API
 *
 * Builds the {@link EasyAdminPluginContext} handed to plugins and exposes
 * a `usePluginApi()` hook for use inside plugin components.
 *
 * `PluginApiProvider` must be mounted inside `I18nProvider` (for translations)
 * and given the current admin `permissions` so `hasPermission()` works.
 */

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { callLua, on } from '../fivem'
import { notify } from '../lib/notify'
import { useTranslation } from '../lib/i18n'
import type { Permissions } from '../types'
import type { EasyAdminPluginContext } from './types'
import { getRegisteredPlugins } from './registry'

// ---------------------------------------------------------------------------
// Lua bridge
// ---------------------------------------------------------------------------

/**
 * Call a Lua handler belonging to a plugin.
 *
 * Routes through the single `pluginCall` NUI callback which dispatches
 * to handlers registered via `RegisterEasyAdminPluginHandler` (client)
 * or `RegisterEasyAdminPluginServerHandler` (server).
 *
 * @param server When `true`, forwards to the server-side bridge instead of
 *   looking up a client handler.
 */
export function callLuaPlugin<T = unknown>(
  pluginId: string,
  action: string,
  data?: unknown,
  server?: boolean,
): Promise<T> {
  return callLua<T>('pluginCall', { pluginId, action, data: data ?? {}, server: server === true })
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface PluginApiContextValue {
  permissions: Permissions
}

const PluginApiContext = createContext<PluginApiContextValue | null>(null)

// Stable empty object so `permissions` doesn't change identity every render
// when there is no provider (e.g. outside the visible tree).
const EMPTY_PERMISSIONS: Permissions = {}

interface PluginApiProviderProps {
  permissions: Permissions
  children: ReactNode
}

type PermsRef = { current: Permissions }
type TranslationFn = (key: string, params?: Record<string, string | number>) => string
type TRef = { current: TranslationFn }

function buildPluginApi(
  pluginId: string,
  permsRef: PermsRef,
  tRef: TRef,
): EasyAdminPluginContext {
  return {
    pluginId,
    callLua: <T,>(action: string, data?: unknown, server?: boolean) => callLuaPlugin<T>(pluginId, action, data, server),
    on,
    hasPermission: (perm: string) => !!permsRef.current[perm],
    t: (key: string, params?: Record<string, string | number>) => tRef.current(key, params),
    notify,
  }
}

/**
 * Provides permissions (and indirectly i18n/notify) to plugin components.
 *
 * Also runs each plugin's `onActivate` lifecycle hook exactly once on mount.
 */
export function PluginApiProvider({ permissions, children }: PluginApiProviderProps) {
  const { t } = useTranslation()

  // Live refs so the activation context stays current without re-running the
  // activation effect. Updated in an effect (not during render) to comply
  // with react-hooks/refs.
  const permsRef = useRef<Permissions>(permissions)
  const tRef = useRef<TranslationFn>(t)

  // Sync refs whenever permissions/translations change.
  useEffect(() => {
    permsRef.current = permissions
  }, [permissions])
  useEffect(() => {
    tRef.current = t
  }, [t])

  // Activate every plugin once on mount — refs keep the context live.
  useEffect(() => {
    const cleanups: Array<() => void> = []
    for (const plugin of getRegisteredPlugins()) {
      if (typeof plugin.onActivate !== 'function') continue
      const ctx = buildPluginApi(plugin.id, permsRef, tRef)
      try {
        const cleanup = plugin.onActivate(ctx)
        if (typeof cleanup === 'function') cleanups.push(cleanup)
      } catch (err) {
        console.error(`[EasyAdmin Plugin] "${plugin.id}" onActivate failed:`, err)
      }
    }
    return () => {
      for (const fn of cleanups) {
        try {
          fn()
        } catch (err) {
          console.error('[EasyAdmin Plugin] cleanup failed:', err)
        }
      }
    }
  }, [])

  const value = useMemo<PluginApiContextValue>(() => ({ permissions }), [permissions])

  return <PluginApiContext.Provider value={value}>{children}</PluginApiContext.Provider>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook for plugin components to access the plugin API.
 *
 * @param pluginId - The id of the plugin this component belongs to.
 *
 * @example
 * ```tsx
 * function MyPage({ pluginId }: PluginPageProps) {
 *   const api = usePluginApi(pluginId)
 *   const [info, setInfo] = useState(null)
 *   useEffect(() => {
 *     api.callLua('getInfo').then(setInfo)
 *   }, [api])
 *   return <div>{JSON.stringify(info)}</div>
 * }
 * ```
 */
export function usePluginApi(pluginId: string): EasyAdminPluginContext {
  const ctx = useContext(PluginApiContext)
  const permissions = ctx?.permissions ?? EMPTY_PERMISSIONS
  const { t } = useTranslation()

  return useMemo<EasyAdminPluginContext>(
    () => ({
      pluginId,
      callLua: <T,>(action: string, data?: unknown, server?: boolean) => callLuaPlugin<T>(pluginId, action, data, server),
      on,
      hasPermission: (perm: string) => !!permissions[perm],
      t,
      notify,
    }),
    [pluginId, permissions, t],
  )
}
