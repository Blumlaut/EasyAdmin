/**
 * Copy text to the system clipboard.
 *
 * FiveM's CEF blocks navigator.clipboard via permissions policy, so we use
 * the legacy document.execCommand('copy') approach instead.
 */
export function copyToClipboard(text: string): void {
  const el = document.createElement('textarea')
  el.value = text
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}
