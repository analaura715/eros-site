import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTheme, themeColors, ThemeColor } from "@/components/theme-provider";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-dashed" title="Mudar Tema">
          <Palette className="h-4 w-4 text-foreground/80" />
          <span className="sr-only">Mudar Tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cores do Sistema</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(themeColors) as ThemeColor[]).map((key) => {
          const colorInfo = themeColors[key];
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => setTheme(key)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div 
                className={`h-4 w-4 rounded-full border ${theme === key ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
                style={{ backgroundColor: colorInfo.hex }}
              />
              <span className={theme === key ? 'font-medium' : ''}>{colorInfo.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
