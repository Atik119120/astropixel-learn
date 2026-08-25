"use client";

import dynamic from "next/dynamic";

const CoursesPage = dynamic(() => import("@/pages/CoursesPage"), { ssr: false });

export default function Home() {
  return <CoursesPage />;
}
