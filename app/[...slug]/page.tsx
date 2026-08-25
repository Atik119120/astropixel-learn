"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import React, { Suspense } from "react";

const CoursesPage = dynamic(() => import("@/pages/CoursesPage"), { ssr: false });
const AllCoursesCatalogPage = dynamic(() => import("@/pages/AllCoursesCatalogPage"), { ssr: false });
const CourseLandingPage = dynamic(() => import("@/pages/CourseLandingPage"), { ssr: false });
const LearnAboutPage = dynamic(() => import("@/pages/LearnAboutPage"), { ssr: false });
const LearnContactPage = dynamic(() => import("@/pages/LearnContactPage"), { ssr: false });
const StudentLoginPage = dynamic(() => import("@/pages/StudentLoginPage"), { ssr: false });
const StudentDashboard = dynamic(() => import("@/pages/StudentDashboard"), { ssr: false });
const MyCertificatesPage = dynamic(() => import("@/pages/MyCertificatesPage"), { ssr: false });
const CourseViewerPage = dynamic(() => import("@/pages/CourseViewerPage"), { ssr: false });
const TeacherLoginPage = dynamic(() => import("@/pages/TeacherLoginPage"), { ssr: false });
const TeacherDashboard = dynamic(() => import("@/pages/TeacherDashboard"), { ssr: false });
const AdminLoginPage = dynamic(() => import("@/pages/AdminLoginPage"), { ssr: false });
const AdminDashboard = dynamic(() => import("@/pages/AdminDashboard"), { ssr: false });
const DashboardPage = dynamic(() => import("@/pages/DashboardPage"), { ssr: false });
const CertificatePage = dynamic(() => import("@/pages/CertificatePage"), { ssr: false });
const VerifyCertificatePage = dynamic(() => import("@/pages/VerifyCertificatePage"), { ssr: false });
const ForgotPasswordPage = dynamic(() => import("@/pages/ForgotPasswordPage"), { ssr: false });
const ResetPasswordPage = dynamic(() => import("@/pages/ResetPasswordPage"), { ssr: false });
const PaymentCallbackPage = dynamic(() => import("@/pages/PaymentCallbackPage"), { ssr: false });
const PaymentCancelPage = dynamic(() => import("@/pages/PaymentCancelPage"), { ssr: false });
const CustomCheckoutPage = dynamic(() => import("@/pages/CustomCheckoutPage"), { ssr: false });
const NotFound = dynamic(() => import("@/pages/NotFound"), { ssr: false });

export default function DynamicSubRoute() {
  const pathname = usePathname() || "/";

  const renderContent = () => {
    if (pathname === "/") return <CoursesPage />;
    if (pathname === "/courses" || pathname === "/courses/all") return <AllCoursesCatalogPage />;
    if (pathname === "/about") return <LearnAboutPage />;
    if (pathname === "/contact") return <LearnContactPage />;
    if (
      pathname === "/login" ||
      pathname === "/student/login" ||
      pathname === "/teacher/login" ||
      pathname === "/admin/login" ||
      pathname === "/student/register" ||
      pathname === "/auth"
    ) {
      return <StudentLoginPage />;
    }
    if (pathname.startsWith("/student/course/")) return <CourseViewerPage />;
    if (pathname.startsWith("/student")) return <StudentDashboard />;
    if (pathname === "/teacher/login") return <TeacherLoginPage />;
    if (pathname.startsWith("/teacher")) return <TeacherDashboard />;
    if (pathname === "/admin/login") return <AdminLoginPage />;
    if (pathname.startsWith("/admin")) return <AdminDashboard />;
    if (pathname === "/dashboard") return <DashboardPage />;
    if (pathname === "/my-certificates" || pathname === "/student/certificates") return <MyCertificatesPage />;
    if (pathname.startsWith("/certificate/")) return <CertificatePage />;
    if (pathname === "/verify-certificate") return <VerifyCertificatePage />;
    if (pathname === "/forgot-password") return <ForgotPasswordPage />;
    if (pathname === "/reset-password") return <ResetPasswordPage />;
    if (pathname === "/payment/callback") return <PaymentCallbackPage />;
    if (pathname === "/payment/cancel") return <PaymentCancelPage />;
    if (pathname.startsWith("/pay/")) return <CustomCheckoutPage />;
    if (pathname.startsWith("/courses/") || pathname === "/vibe-coding") return <CourseLandingPage />;

    return <NotFound />;
  };

  return <Suspense fallback={<div className="min-h-screen bg-background" />}>{renderContent()}</Suspense>;
}
