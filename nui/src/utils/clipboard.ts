/**
 * Copy text to the system clipboard.
 *
 * FiveM's CEF blocks navigator.clipboard via permissions policy, so we use
 * the legacy document.execCommand('copy') approach instead.
 *
 * Using `focus()` + `setSelectionRange()` instead of `select()` because the
 * latter can fail silently in CEF when the element is created dynamically
 * (no visible selection, so `execCommand('copy')` copies nothing).
 */
export function copyToClipboard(text: string): void {
  const el = document.createElement('textarea')
  el.value = text
  // Prevent the textarea from being visible/scrollable during the brief
  // moment it lives in the DOM.
  el.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0'
  document.body.appendChild(el)
  try {
    el.focus()
    el.setSelectionRange(0, text.length)
    document.execCommand('copy')
  } finally {
    document.body.removeChild(el)
  }
}
