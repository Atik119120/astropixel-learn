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
import CoursesPage from "./pages/CoursesPage";
import AllCoursesCatalogPage from "./pages/AllCoursesCatalogPage";
import LearnAboutPage from "./pages/LearnAboutPage";
import LearnContactPage from "./pages/LearnContactPage";
import NotFound from "./pages/NotFound";

// Lazy-loaded LMS Dashboards & Features
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const StudentLoginPage = lazy(() => import("./pages/StudentLoginPage"));
const TeacherLoginPage = lazy(() => import("./pages/TeacherLoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const MyCertificatesPage = lazy(() => import("./pages/MyCertificatesPage"));
const CourseViewerPage = lazy(() => import("./pages/CourseViewerPage"));
const CertificatePage = lazy(() => import("./pages/CertificatePage"));
const VerifyCertificatePage = lazy(() => import("./pages/VerifyCertificatePage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const PaymentCallbackPage = lazy(() => import("./pages/PaymentCallbackPage"));
const PaymentCancelPage = lazy(() => import("./pages/PaymentCancelPage"));
const CustomCheckoutPage = lazy(() => import("./pages/CustomCheckoutPage"));
const CourseLandingPage = lazy(() => import("./pages/CourseLandingPage"));

const queryClient = new QueryClient();

function AppContent() {
  const location = useLocation();

  return (
    <>
      <SmoothScroll />
      <ScrollReveal />
      <ScrollToTop />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes key={location.pathname}>
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
        </motion.div>
      </AnimatePresence>
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
