import { useEffect, useState } from 'react'

type Theme = 'cmyk' | 'forest'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    return stored ?? 'forest'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => (t === 'cmyk' ? 'forest' : 'cmyk'))

  return { theme, toggle }
}