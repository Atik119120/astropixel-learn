import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, memo } from "react";
import logoFullPng from "@/assets/logo-full.png";
import learnIconJson from "@/assets/learn-preloader-icon.png.asset.json";
import agencyLogoJson from "@/assets/astropixel-logo.png.asset.json";

const learnIcon: string = learnIconJson.url;
const agencyLogo: string = typeof logoFullPng === 'string' ? logoFullPng : ((logoFullPng as any)?.src || agencyLogoJson.url);
const LEARN_ROUTES = ["/courses", "/instructors", "/learn-about", "/learn-contact"];

const Preloader = memo(({ onComplete }: { onComplete: () => void }) => {
  const isLearn = typeof window !== "undefined" && (
    window.location.hostname.startsWith("learn.") ||
    LEARN_ROUTES.some((r) => window.location.pathname.startsWith(r))
  );
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 200);
    }, 700);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const logoSrc = isLearn ? learnIcon : agencyLogo;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
        >
          {/* Subtle radial backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06),transparent_60%)]" />

          {/* Logo with breathing + soft glow */}
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: [0.95, 1.04, 0.98, 1], opacity: 1 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <div className="absolute inset-0 blur-2xl opacity-40 bg-gradient-to-tr from-cyan-400/40 to-blue-500/40 rounded-full" />
              <img
                src={logoSrc}
                alt="Astropixel"
                width={120}
                height={120}
                className="relative h-20 md:h-24 w-auto max-w-[260px] md:max-w-[320px]"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
              />
            </motion.div>
          </div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="mt-6 text-sm md:text-base tracking-[0.25em] uppercase font-medium text-slate-700"
          >
            From <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">zero</span> to impact
          </motion.p>

          {/* Thin indeterminate progress line */}
          <div className="mt-6 w-40 h-[2px] rounded-full overflow-hidden bg-slate-200/70 relative">
            <motion.div
              className="absolute top-0 left-0 h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
              initial={{ x: "-100%" }}
              animate={{ x: "300%" }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default Preloader;
