/** Copy text to the system clipboard. Works in FiveM's CEF. */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}
