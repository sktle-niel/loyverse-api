import { useEffect, useState } from 'react'

type Theme = 'cmyk' | 'forest'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'forest'
      : 'cmyk'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => (t === 'cmyk' ? 'forest' : 'cmyk'))

  return { theme, toggle }
}