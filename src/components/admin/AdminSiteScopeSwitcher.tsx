import React from "react";

interface AdminSiteScopeSwitcherProps {
  activeScope?: string;
  onScopeChange?: (scope: string) => void;
}

export default function AdminSiteScopeSwitcher({ activeScope = "learn", onScopeChange }: AdminSiteScopeSwitcherProps) {
  // Hidden as per user request
  return null;
}
