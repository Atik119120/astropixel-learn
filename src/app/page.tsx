"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

const App = dynamic(() => import("@/App"), { ssr: false });

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-foreground"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>}>
      <App />
    </Suspense>
  );
}
