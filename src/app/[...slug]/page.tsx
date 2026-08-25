"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import React, { Suspense } from "react";

const CoursesPage = dynamic(() => import("@/views/CoursesPage"), { ssr: false });
const AllCoursesCatalogPage = dynamic(() => import("@/views/AllCoursesCatalogPage"), { ssr: false });
const CourseLandingPage = dynamic(() => import("@/views/CourseLandingPage"), { ssr: false });
const LearnAboutPage = dynamic(() => import("@/views/LearnAboutPage"), { ssr: false });
const LearnContactPage = dynamic(() => import("@/views/LearnContactPage"), { ssr: false });
const StudentLoginPage = dynamic(() => import("@/views/StudentLoginPage"), { ssr: false });
const StudentDashboard = dynamic(() => import("@/views/StudentDashboard"), { ssr: false });
const MyCertificatesPage = dynamic(() => import("@/views/MyCertificatesPage"), { ssr: false });
const CourseViewerPage = dynamic(() => import("@/views/CourseViewerPage"), { ssr: false });
const TeacherLoginPage = dynamic(() => import("@/views/TeacherLoginPage"), { ssr: false });
const TeacherDashboard = dynamic(() => import("@/views/TeacherDashboard"), { ssr: false });
const AdminLoginPage = dynamic(() => import("@/views/AdminLoginPage"), { ssr: false });
const AdminDashboard = dynamic(() => import("@/views/AdminDashboard"), { ssr: false });
const DashboardPage = dynamic(() => import("@/views/DashboardPage"), { ssr: false });
const CertificatePage = dynamic(() => import("@/views/CertificatePage"), { ssr: false });
const VerifyCertificatePage = dynamic(() => import("@/views/VerifyCertificatePage"), { ssr: false });
const ForgotPasswordPage = dynamic(() => import("@/views/ForgotPasswordPage"), { ssr: false });
const ResetPasswordPage = dynamic(() => import("@/views/ResetPasswordPage"), { ssr: false });
const PaymentCallbackPage = dynamic(() => import("@/views/PaymentCallbackPage"), { ssr: false });
const PaymentCancelPage = dynamic(() => import("@/views/PaymentCancelPage"), { ssr: false });
const CustomCheckoutPage = dynamic(() => import("@/views/CustomCheckoutPage"), { ssr: false });
const NotFound = dynamic(() => import("@/views/NotFound"), { ssr: false });

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
