import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import CoursesNavbar from "./CoursesNavbar";
import Footer from "./Footer";
import CoursesFooter from "./CoursesFooter";

interface LayoutProps {
  children: ReactNode;
  flushTop?: boolean;
}

const LEARN_ROUTES = ["/courses", "/instructors", "/learn-about", "/learn-contact"];

const Layout = ({ children, flushTop = false }: LayoutProps) => {
  const location = useLocation();
  const isLearnSubdomain = typeof window !== "undefined" && window.location.hostname.startsWith("learn.");
  const isLearnContext = isLearnSubdomain || LEARN_ROUTES.some((r) => location.pathname.startsWith(r));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CoursesNavbar />
      <main className={flushTop ? "flex-1" : "flex-1 pt-16"}>
        {children}
      </main>
      <CoursesFooter />
    </div>
  );
};

export default Layout;

