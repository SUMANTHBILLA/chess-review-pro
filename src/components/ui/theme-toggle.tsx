import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from './button'

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <span style={{ width: 40, display: 'inline-block' }} />

  const current = theme === 'system' ? systemTheme : theme

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(current === 'dark' ? 'light' : 'dark')}
      className="text-neutral-400 hover:text-white"
      title="Toggle theme"
    >
      {current === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  )
}
