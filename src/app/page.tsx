"use client";

import dynamic from "next/dynamic";

const CoursesPage = dynamic(() => import("@/views/CoursesPage"), { ssr: false });

export default function Home() {
  return <CoursesPage />;
}
