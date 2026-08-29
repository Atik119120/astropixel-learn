"use client";

import React from "react";
import { MemoryRouter } from "react-router";

export function AppRouterWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      {children}
    </MemoryRouter>
  );
}
