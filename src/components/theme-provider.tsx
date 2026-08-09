import { createContext, useContext, useEffect, useState } from "react"

export type ThemeColor = "azul" | "verde" | "laranja" | "roxo" | "vermelho" | "rosa" | "preto";

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: ThemeColor
  storageKey?: string
}

type ThemeProviderState = {
  theme: ThemeColor
  setTheme: (theme: ThemeColor) => void
}

const initialState: ThemeProviderState = {
  theme: "azul",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

// Valores em OKLCH para o Tailwind v4 e Shadcn
export const themeColors: Record<ThemeColor, { primary: string, foreground: string, label: string, hex: string }> = {
  azul: { primary: "0.546 0.245 262.881", foreground: "0.985 0 0", label: "Azul (Padrão)", hex: "#2563eb" },
  verde: { primary: "0.627 0.194 149.214", foreground: "0.985 0 0", label: "Verde Esmeralda", hex: "#059669" },
  laranja: { primary: "0.646 0.222 41.116", foreground: "0.985 0 0", label: "Laranja", hex: "#ea580c" },
  roxo: { primary: "0.551 0.277 300.5", foreground: "0.985 0 0", label: "Roxo", hex: "#9333ea" },
  vermelho: { primary: "0.577 0.245 27.325", foreground: "0.985 0 0", label: "Vermelho", hex: "#dc2626" },
  rosa: { primary: "0.6 0.24 335", foreground: "0.985 0 0", label: "Rosa", hex: "#db2777" },
  preto: { primary: "0.208 0.042 265.755", foreground: "0.985 0 0", label: "Escuro / Neutro", hex: "#0f172a" },
}

export function ThemeProvider({
  children,
  defaultTheme = "azul",
  storageKey = "nexa-crm-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeColor>(() => {
    if (typeof window !== "undefined") {
      return (window.localStorage.getItem(storageKey) as ThemeColor) || defaultTheme
    }
    return defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement

    if (themeColors[theme]) {
      // Injeta diretamente as variáveis no root (que serão lidas pelo Tailwind v4)
      root.style.setProperty("--primary", `oklch(${themeColors[theme].primary})`)
      root.style.setProperty("--primary-foreground", `oklch(${themeColors[theme].foreground})`)
      // Podemos também forçar a variável da paleta do modo escuro para garantir coesão
      // root.style.setProperty("--ring", `oklch(${themeColors[theme].primary})`)
    }
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: ThemeColor) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error("useTheme deve ser usado dentro de um ThemeProvider")
  return context
}
