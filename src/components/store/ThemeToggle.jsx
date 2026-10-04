import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  const isDark = theme === "dark";

  const handleThemeToggle = () => {
    setIsAnimating(true);
    setTheme(isDark ? "light" : "dark");
    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <button
      onClick={handleThemeToggle}
      className="p-2 rounded-full hover:bg-[#E2F1E7] dark:hover:bg-white/10 transition-all duration-300 select-none hover:scale-110 active:scale-95"
      aria-label="Toggle theme"
    >
      <div className={`transition-all duration-500 ${isAnimating ? 'rotate-180 scale-0' : 'rotate-0 scale-100'}`}>
        {isDark ? (
          <Sun className="w-5 h-5 text-[#0A3D2E] dark:text-white" />
        ) : (
          <Moon className="w-5 h-5 text-[#0A3D2E] dark:text-white" />
        )}
      </div>
    </button>
  );
}