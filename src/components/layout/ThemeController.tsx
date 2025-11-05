"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeController() {
  const [theme, setTheme] = useState<"corporate" | "business" | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as
      | "corporate"
      | "business"
      | null;
    const current = saved || "corporate";
    document.documentElement.setAttribute("data-theme", current);
    setTheme(current);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "corporate" ? "business" : "corporate";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost btn-circle hover:bg-base-200 transition-all group"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        {theme === "business" ? (
          <Sun className="w-5 h-5 text-warning group-hover:scale-110 transition-transform" />
        ) : (
          <Moon className="w-5 h-5 text-info group-hover:scale-110 transition-transform" />
        )}
      </div>
    </button>
  );
}
