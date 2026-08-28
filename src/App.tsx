import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollReveal from "@/components/ScrollReveal";

// Primary Learn Pages
import CoursesPage from "./views/CoursesPage";
import AllCoursesCatalogPage from "./views/AllCoursesCatalogPage";
import LearnAboutPage from "./views/LearnAboutPage";
import LearnContactPage from "./views/LearnContactPage";
import NotFound from "./views/NotFound";

// Lazy-loaded LMS Dashboards & Features
const AdminLoginPage = lazy(() => import("./views/AdminLoginPage"));
const StudentLoginPage = lazy(() => import("./views/StudentLoginPage"));
const TeacherLoginPage = lazy(() => import("./views/TeacherLoginPage"));
const DashboardPage = lazy(() => import("./views/DashboardPage"));
const AdminDashboard = lazy(() => import("./views/AdminDashboard"));
const StudentDashboard = lazy(() => import("./views/StudentDashboard"));
const TeacherDashboard = lazy(() => import("./views/TeacherDashboard"));
const MyCertificatesPage = lazy(() => import("./views/MyCertificatesPage"));
const CourseViewerPage = lazy(() => import("./views/CourseViewerPage"));
const CertificatePage = lazy(() => import("./views/CertificatePage"));
const VerifyCertificatePage = lazy(() => import("./views/VerifyCertificatePage"));
const ForgotPasswordPage = lazy(() => import("./views/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./views/ResetPasswordPage"));
const PaymentCallbackPage = lazy(() => import("./views/PaymentCallbackPage"));
const PaymentCancelPage = lazy(() => import("./views/PaymentCancelPage"));
const CustomCheckoutPage = lazy(() => import("./views/CustomCheckoutPage"));
const CourseLandingPage = lazy(() => import("./views/CourseLandingPage"));

const queryClient = new QueryClient();

function AppContent() {
  return (
    <>
      <SmoothScroll />
      <ScrollToTop />

      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-foreground"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>}>
        <Routes>
          {/* Core Public Pages */}
          <Route path="/" element={<CoursesPage />} />
          <Route path="/courses" element={<AllCoursesCatalogPage />} />
          <Route path="/courses/all" element={<AllCoursesCatalogPage />} />
          <Route path="/about" element={<LearnAboutPage />} />
          <Route path="/contact" element={<LearnContactPage />} />

          {/* Unified Login Portal */}
          <Route path="/login" element={<StudentLoginPage />} />
          <Route path="/auth" element={<StudentLoginPage />} />
          <Route path="/student/login" element={<StudentLoginPage />} />
          <Route path="/teacher/login" element={<StudentLoginPage />} />
          <Route path="/admin/login" element={<StudentLoginPage />} />

          {/* Core Dashboards */}
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/*" element={<StudentDashboard />} />

          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/*" element={<TeacherDashboard />} />

          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/*" element={<AdminDashboard />} />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
