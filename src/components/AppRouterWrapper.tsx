"use client";

import React from "react";
import { MemoryRouter } from "react-router";
import { usePathname } from "next/navigation";

export function AppRouterWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";

  return (
    <MemoryRouter initialEntries={[pathname]}>
      {children}
    </MemoryRouter>
  );
}
