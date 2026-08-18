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
import { SiteScopeProvider } from "@/contexts/SiteScopeContext";

// Primary Learn Pages
import CoursesPage from "./pages/CoursesPage";
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

      <SiteScopeProvider>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Suspense fallback={<div className="min-h-screen bg-background" />}>
              <Routes location={location} key={location.pathname}>
                {/* Public Learn Pages */}
                <Route path="/" element={<CoursesPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/all" element={<CoursesPage />} />
                <Route path="/instructors" element={<CoursesPage />} />
                <Route path="/courses/:slug" element={<CourseLandingPage />} />
                <Route path="/vibe-coding" element={<CourseLandingPage />} />
                <Route path="/about" element={<LearnAboutPage />} />
                <Route path="/learn-about" element={<LearnAboutPage />} />
                <Route path="/contact" element={<LearnContactPage />} />
                <Route path="/learn-contact" element={<LearnContactPage />} />

                {/* Student System */}
                <Route path="/student/login" element={<StudentLoginPage />} />
                <Route path="/auth" element={<StudentLoginPage />} />
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/courses" element={<StudentDashboard />} />
                <Route path="/student/course/:courseId" element={<CourseViewerPage />} />

                {/* Teacher System */}
                <Route path="/teacher/login" element={<TeacherLoginPage />} />
                <Route path="/teacher" element={<TeacherDashboard />} />
                <Route path="/teacher/dashboard" element={<TeacherDashboard />} />

                {/* Education Admin System */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/*" element={<AdminDashboard />} />

                {/* Generic Role Dashboard Router */}
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Certificates System */}
                <Route path="/my-certificates" element={<MyCertificatesPage />} />
                <Route path="/certificate/:certificateId" element={<CertificatePage />} />
                <Route path="/verify-certificate" element={<VerifyCertificatePage />} />

                {/* Auth Recovery & Payment Callbacks */}
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/payment/callback" element={<PaymentCallbackPage />} />
                <Route path="/payment/cancel" element={<PaymentCancelPage />} />
                <Route path="/pay/:invoiceId" element={<CustomCheckoutPage />} />

                {/* 404 Catch All */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </SiteScopeProvider>
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
