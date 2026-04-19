export async function copyToClipboard(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    showToast('Copied to clipboard')
    return
  }

  // fallback
  const el = document.createElement('textarea')
  el.value = text
  el.style.position = 'fixed'
  el.style.left = '-9999px'
  document.body.appendChild(el)
  el.select()
  try { document.execCommand('copy') } catch (e) { /* noop */ }
  document.body.removeChild(el)
  showToast('Copied to clipboard')
}

function showToast(msg: string) {
  try {
    const root = document.createElement('div')
    root.className = 'fixed bottom-6 right-6 bg-black text-white text-sm px-4 py-2 rounded shadow'
    root.style.opacity = '0'
    root.style.transition = 'opacity 180ms ease-in-out'
    root.textContent = msg
    document.body.appendChild(root)
    requestAnimationFrame(() => { root.style.opacity = '1' })
    setTimeout(() => { root.style.opacity = '0'; setTimeout(() => root.remove(), 200) }, 1800)
  } catch (e) {
    // ignore
  }
}

export default { copyToClipboard }
