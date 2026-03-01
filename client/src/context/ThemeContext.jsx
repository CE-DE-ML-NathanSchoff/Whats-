import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('communitree_theme')
    return saved ? saved === 'dark' : true
  })

  const toggleTheme = () => {
    setIsDark(prev => {
      localStorage.setItem('communitree_theme', !prev ? 'dark' : 'light')
      return !prev
    })
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
