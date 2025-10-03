import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Palette, Sun, Moon, Monitor, Check } from "lucide-react";
import { toast } from "sonner";

type ThemeMode = "light" | "dark" | "system";

const accentColors = [
  { name: "Default", value: "default", class: "bg-primary" },
  { name: "Blue", value: "blue", class: "bg-blue-500" },
  { name: "Purple", value: "purple", class: "bg-purple-500" },
  { name: "Pink", value: "pink", class: "bg-pink-500" },
  { name: "Green", value: "green", class: "bg-green-500" },
  { name: "Orange", value: "orange", class: "bg-orange-500" },
];

export const ThemeCustomizer = () => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme-mode");
    return (saved as ThemeMode) || "system";
  });
  const [accent, setAccent] = useState(() => {
    return localStorage.getItem("theme-accent") || "default";
  });

  useEffect(() => {
    applyTheme();
  }, [mode, accent]);

  const applyTheme = () => {
    const root = document.documentElement;
    
    // Apply theme mode
    if (mode === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", systemDark);
    } else {
      root.classList.toggle("dark", mode === "dark");
    }

    // Apply accent color
    root.setAttribute("data-accent", accent);
    
    // Save to localStorage
    localStorage.setItem("theme-mode", mode);
    localStorage.setItem("theme-accent", accent);
  };

  const handleModeChange = (newMode: ThemeMode) => {
    setMode(newMode);
    toast.success("Theme mode updated");
  };

  const handleAccentChange = (newAccent: string) => {
    setAccent(newAccent);
    toast.success("Accent color updated");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Theme Customization
        </CardTitle>
        <CardDescription>
          Personalize your app appearance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Mode */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Theme Mode</Label>
          <RadioGroup value={mode} onValueChange={handleModeChange}>
            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="light" id="theme-light" />
              <Label
                htmlFor="theme-light"
                className="flex-1 cursor-pointer font-normal flex items-center gap-2"
              >
                <Sun className="w-4 h-4" />
                Light
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="dark" id="theme-dark" />
              <Label
                htmlFor="theme-dark"
                className="flex-1 cursor-pointer font-normal flex items-center gap-2"
              >
                <Moon className="w-4 h-4" />
                Dark
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="system" id="theme-system" />
              <Label
                htmlFor="theme-system"
                className="flex-1 cursor-pointer font-normal flex items-center gap-2"
              >
                <Monitor className="w-4 h-4" />
                System
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Accent Color */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Accent Color</Label>
          <div className="grid grid-cols-3 gap-3">
            {accentColors.map((color) => (
              <button
                key={color.value}
                onClick={() => handleAccentChange(color.value)}
                className={`
                  relative p-4 rounded-lg border-2 transition-all
                  ${accent === color.value ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"}
                `}
              >
                <div className={`w-full h-12 rounded-md ${color.class}`} />
                <p className="text-sm font-medium mt-2">{color.name}</p>
                {accent === color.value && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            handleModeChange("system");
            handleAccentChange("default");
          }}
          className="w-full"
        >
          Reset to Defaults
        </Button>
      </CardContent>
    </Card>
  );
};
