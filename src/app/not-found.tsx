"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { AppRouterWrapper } from "@/components/AppRouterWrapper";

const NotFound = dynamic(() => import("@/views/NotFound"), { ssr: false });

export default function NotFoundPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-foreground"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>}>
      <AppRouterWrapper>
        <NotFound />
      </AppRouterWrapper>
    </Suspense>
  );
}
