type ToastOpts = { actionLabel?: string; onAction?: () => void; duration?: number }

export function showToast(msg: string, opts: ToastOpts = {}) {
  try {
    const root = document.createElement('div')
    root.className = 'fixed bottom-6 right-6 z-50'

    const toast = document.createElement('div')
    toast.className = 'min-w-[200px] max-w-sm bg-black text-white text-sm px-4 py-2 rounded shadow flex items-center gap-3'
    toast.setAttribute('role', 'status')
    toast.setAttribute('aria-live', 'polite')

    const msgSpan = document.createElement('div')
    msgSpan.textContent = msg

    toast.appendChild(msgSpan)

    if (opts.actionLabel && typeof opts.onAction === 'function') {
      const btn = document.createElement('button')
      btn.className = 'ml-auto text-xs font-semibold underline underline-offset-2'
      btn.textContent = opts.actionLabel
      btn.onclick = () => {
        try { opts.onAction!() } catch (e) { /* ignore */ }
        remove()
      }
      toast.appendChild(btn)
    }

    root.appendChild(toast)
    document.body.appendChild(root)

    requestAnimationFrame(() => { toast.style.opacity = '1' })

    const duration = opts.duration ?? 3000
    const t = setTimeout(() => remove(), duration)

    function remove() {
      clearTimeout(t)
      try { toast.style.opacity = '0'; setTimeout(() => { root.remove() }, 180) } catch (e) { root.remove() }
    }
  } catch (e) {
    // noop
  }
}

export default { showToast }
