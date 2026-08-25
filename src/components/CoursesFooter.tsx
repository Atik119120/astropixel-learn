import { ArrowUp, Facebook, Instagram, MessageCircle, Mail, Phone, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import learnLogoAssetJson from "@/assets/learn-with-alphazero-logo.png.asset.json";
const learnLogo = learnLogoAssetJson.url;
import { useLanguage } from "@/contexts/LanguageContext";

const CoursesFooter = () => {
  const { language } = useLanguage();
  const isBn = language === "bn";

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const navLinks = [
    { name: isBn ? "হোম" : "Home", to: "/" },
    { name: isBn ? "কোর্সসমূহ" : "Courses", to: "/courses" },
    { name: isBn ? "আমাদের সম্পর্কে" : "About Us", to: "/about" },
    { name: isBn ? "যোগাযোগ" : "Contact", to: "/contact" },
  ];

  const socials = [
    { icon: Facebook, url: "https://www.facebook.com/share/1Zm7yMhPtk/", label: "Facebook" },
    { icon: Instagram, url: "https://www.instagram.com/astropixel.tech", label: "Instagram" },
    { icon: Youtube, url: "https://youtube.com/@astropixel_tech", label: "YouTube" },
    { icon: MessageCircle, url: "https://wa.me/8801776965533", label: "WhatsApp" },
    { icon: Mail, url: "mailto:hello@astropixel.tech", label: "Email" },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-purple-500/30 bg-gradient-to-br from-[#1B0A33] via-[#2D0F55] to-[#120524] text-white pt-14 pb-8 shadow-2xl">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-purple-500/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-indigo-500/20 blur-[130px] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />

      <div className="container mx-auto px-5 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto grid gap-8 sm:gap-12 sm:grid-cols-2 lg:grid-cols-4 pb-12">
          {/* Brand */}
          <div className="lg:col-span-1 space-y-4">
            <img
              src={learnLogo}
              alt="Learn with AlphaZero"
              className="h-10 w-auto brightness-0 invert mb-2"
            />
            <p className="text-sm text-purple-200/80 leading-relaxed">
              {isBn
                ? "১০০% অনলাইন-ভিত্তিক প্র্যাক্টিক্যাল ও AI-পাওয়ার্ড কোর্স। Learn with AlphaZero-র সাথে নিজের সেরা স্কিল গড়ুন।"
                : "100% online, practical & AI-powered courses. Build your digital skills with Learn with AlphaZero."}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-bold tracking-wider uppercase text-purple-300 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              {isBn ? "ন্যাভিগেশন" : "Navigation"}
            </h4>
            <ul className="space-y-2.5">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="group flex items-center gap-2 text-sm text-purple-100/80 hover:text-white transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-400/40 group-hover:bg-purple-300 group-hover:scale-125 transition-all" />
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-bold tracking-wider uppercase text-purple-300 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              {isBn ? "সোশ্যাল মিডিয়া" : "Social Media"}
            </h4>
            <ul className="space-y-2.5">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2.5 text-sm text-purple-100/80 hover:text-white transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-white/10 group-hover:bg-purple-500 group-hover:text-white transition-all">
                      <s.icon size={14} />
                    </div>
                    <span>{s.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold tracking-wider uppercase text-purple-300 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              {isBn ? "যোগাযোগ" : "Contact Support"}
            </h4>
            <div className="space-y-3 text-sm">
              <a href="tel:+8801776965533" className="flex items-center gap-2.5 text-purple-100/80 hover:text-white transition-colors">
                <div className="p-1.5 rounded-lg bg-white/10 text-purple-300">
                  <Phone size={14} />
                </div>
                <span>+880 1776-965533</span>
              </a>
              <a href="mailto:hello@astropixel.tech" className="flex items-center gap-2.5 text-purple-100/80 hover:text-white transition-colors break-all">
                <div className="p-1.5 rounded-lg bg-white/10 text-purple-300">
                  <Mail size={14} />
                </div>
                <span>hello@astropixel.tech</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 relative z-10 pt-4">
        <div className="container mx-auto px-5 sm:px-6 pb-16 sm:pb-2">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
            <span className="text-xs text-purple-200/70">
              © {new Date().getFullYear()} <strong className="text-white">Learn with AlphaZero</strong>. All rights reserved.
            </span>
            <button
              onClick={scrollToTop}
              className="group w-9 h-9 rounded-full border border-purple-400/40 bg-white/10 text-white flex items-center justify-center hover:bg-purple-500 hover:border-purple-500 transition-all shadow-md"
              aria-label="Scroll to top"
            >
              <ArrowUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CoursesFooter;
