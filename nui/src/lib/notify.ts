import { callLua } from '../fivem'
import type { Notification } from '../types'

/**
 * Trigger a FiveM native feed notification via the Lua backend.
 *
 * Replaces the old NUI toast system. Notifications appear as GTA/REDm
 * native feed entries with EasyAdmin branding.
 *
 * @param text - The notification message text
 * @param _type - Reserved for future use (native notifications don't support type variants)
 */
export function notify(text: string, _type?: Notification['type']): void {
  callLua('showNotification', { text }).catch(() => {})
}
