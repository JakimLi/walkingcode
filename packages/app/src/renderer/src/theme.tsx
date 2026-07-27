/**
 * Theme provider — light/dark theme switched via a `data-theme` attribute on
 * <html>. All Tailwind color tokens resolve to CSS variables that key off that
 * attribute (see styles.css), so flipping it recolours the whole app.
 *
 * The choice persists to localStorage and is applied on mount.
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

export const THEME_KEY = 'wc:theme'

interface ThemeCtx {
  theme: Theme
  toggleTheme: () => void
}

const Ctx = createContext<ThemeCtx>({ theme: 'dark', toggleTheme: () => {} })

/** Read the initial theme from localStorage (called before React mounts). */
export function readInitialTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* ignore */
  }
  return 'dark'
}

/** Apply the theme to <html> (idempotent — safe to call before mount). */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)

  // keep the DOM attribute in sync. applyTheme runs in the render body (not in
  // an effect) so the CSS variables are updated *before* children render —
  // otherwise DiagramView's cssVar() calls would read the previous theme's
  // values during the render pass.
  applyTheme(theme)
  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* ignore quota errors */
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return <Ctx.Provider value={{ theme, toggleTheme }}>{children}</Ctx.Provider>
}

export function useTheme(): ThemeCtx {
  return useContext(Ctx)
}
