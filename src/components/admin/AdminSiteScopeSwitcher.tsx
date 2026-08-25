import React from "react";

interface AdminSiteScopeSwitcherProps {
  activeScope?: string;
  onScopeChange?: (scope: string) => void;
}

export default function AdminSiteScopeSwitcher({ activeScope = "learn", onScopeChange }: AdminSiteScopeSwitcherProps) {
  return (
    <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg border border-border/50">
      <button
        type="button"
        onClick={() => onScopeChange?.("learn")}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          activeScope === "learn"
            ? "bg-background text-foreground shadow-sm font-semibold"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Learn Site
      </button>
      <button
        type="button"
        onClick={() => onScopeChange?.("main")}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          activeScope === "main"
            ? "bg-background text-foreground shadow-sm font-semibold"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Main Platform
      </button>
    </div>
  );
}
