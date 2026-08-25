import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, User, ArrowUpRight, LayoutGrid, Info, Phone, Home, Globe } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import learnLogoAssetJson from "@/assets/learn-with-alphazero-logo.png.asset.json";
const learnLogo = learnLogoAssetJson.url;
import SearchModal from "./SearchModal";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const isBn = language === "bn";

  const navLinks = [
    { name: isBn ? "হোম" : "Home", to: "/", icon: Home },
    { name: isBn ? "কোর্সসমূহ" : "Courses", to: "/courses", icon: LayoutGrid },
    { name: isBn ? "আমাদের সম্পর্কে" : "About", to: "/about", icon: Info },
    { name: isBn ? "যোগাযোগ" : "Contact", to: "/contact", icon: Phone },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 w-full h-[64px] flex items-center bg-background border-b border-border/40 shadow-sm transition-all duration-300">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between"
          >
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={learnLogo}
                alt="AstroPixel Education Logo"
                className="h-8 sm:h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1.5 bg-neutral-100/80 p-1.5 rounded-full border border-black/5">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.to}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                      isActive
                        ? "bg-[#6D28D9] text-white shadow-sm"
                        : "text-neutral-700 hover:text-black hover:bg-white/60"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2.5">
              {/* Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-full text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
                aria-label="Search courses"
              >
                <Search size={18} />
              </button>

              {/* Student Portal Button */}
              <Link
                to="/student/login"
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full bg-[#6D28D9] text-white hover:bg-[#5B21B6] transition-all shadow-sm hover:shadow"
              >
                <User size={14} />
                <span className="hidden sm:inline">Student Portal</span>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-4 top-20 z-40 p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xl md:hidden"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors"
                  >
                    <Icon size={18} className="text-[#6D28D9]" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Navbar;