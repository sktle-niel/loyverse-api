import { useEffect, useState } from 'react'

type Theme = 'silk' | 'sunset'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'sunset'
      : 'silk'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => (t === 'silk' ? 'sunset' : 'silk'))

  return { theme, toggle }
}