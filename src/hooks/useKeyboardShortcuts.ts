import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface Shortcut {
  key: string
  ctrlOrCmd: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  const shortcuts: Shortcut[] = [
    { key: 'd', ctrlOrCmd: true, action: () => navigate('/'), description: 'Go to Dashboard' },
    { key: 't', ctrlOrCmd: true, action: () => navigate('/transactions'), description: 'Go to Transactions' },
    { key: 'a', ctrlOrCmd: true, action: () => navigate('/accounts'), description: 'Go to Accounts' },
    { key: 'b', ctrlOrCmd: true, action: () => navigate('/budgets'), description: 'Go to Budgets' },
    { key: 'r', ctrlOrCmd: true, action: () => navigate('/reports'), description: 'Go to Reports' },
    { key: ',', ctrlOrCmd: true, action: () => navigate('/settings'), description: 'Go to Settings' },
    { key: 'n', ctrlOrCmd: true, action: () => {
      const event = new CustomEvent('shortcut:new-transaction')
      window.dispatchEvent(event)
    }, description: 'New Transaction' },
  ]

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
      (e.target as HTMLElement).tagName
    )

    if (isInputFocused) return

    const ctrlOrCmd = e.ctrlKey || e.metaKey

    for (const shortcut of shortcuts) {
      if (
        e.key.toLowerCase() === shortcut.key.toLowerCase() &&
        ctrlOrCmd === shortcut.ctrlOrCmd &&
        (!shortcut.shift || e.shiftKey) &&
        (!shortcut.alt || e.altKey)
      ) {
        e.preventDefault()
        shortcut.action()
        return
      }
    }
  }, [navigate])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return shortcuts
}

export function useShortcutListener(
  eventName: string,
  callback: () => void
) {
  useEffect(() => {
    const handler = () => callback()
    window.addEventListener(eventName, handler)
    return () => window.removeEventListener(eventName, handler)
  }, [eventName, callback])
}
