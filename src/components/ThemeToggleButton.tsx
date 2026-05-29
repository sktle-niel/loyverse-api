interface ThemeToggleButtonProps {
  onToggle: () => void
  currentTheme: string
}

export function ThemeToggleButton({ onToggle, currentTheme }: ThemeToggleButtonProps) {
  const isDark = currentTheme === 'forest'

  return (
    <button
      onClick={onToggle}
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 w-8 h-8 flex items-center justify-center rounded-full bg-base-100 border border-base-content/10 text-base-content/50 hover:text-base-content hover:border-base-content/20 transition-all duration-200 shadow-sm z-50"
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  )
}
