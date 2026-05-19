// Floating theme toggle button
interface ThemeToggleButtonProps {
  onToggle: () => void
  currentTheme: string
}

export function ThemeToggleButton({ onToggle, currentTheme }: ThemeToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 btn btn-circle btn-primary shadow-lg hover:shadow-xl transition-shadow"
      title={`Switch to ${currentTheme === 'silk' ? 'sunset' : 'silk'} theme`}
      aria-label="Toggle theme"
    >
      {currentTheme === 'silk' ? '🌅' : '☀️'}
    </button>
  )
}
