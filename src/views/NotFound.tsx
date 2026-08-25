import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Menu, X } from "lucide-react";

const NAV_ITEMS = ["About Us", "Programs", "Reviews", "FAQ", "Contacts"];

const NotFound = () => {
  const textRef = useRef<HTMLDivElement>(null);
  const [scaleY, setScaleY] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);

  // Load Inter font once
  useEffect(() => {
    if (document.getElementById("inter-font-404")) return;
    const pre1 = document.createElement("link");
    pre1.rel = "preconnect";
    pre1.href = "https://fonts.googleapis.com";
    const pre2 = document.createElement("link");
    pre2.rel = "preconnect";
    pre2.href = "https://fonts.gstatic.com";
    pre2.crossOrigin = "anonymous";
    const link = document.createElement("link");
    link.id = "inter-font-404";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
    document.head.append(pre1, pre2, link);
  }, []);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "404 - Page Not Found";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  useEffect(() => {
    const measure = () => {
      if (!textRef.current) return;
      const h = textRef.current.offsetHeight;
      if (h > 0) setScaleY((window.innerHeight / h) * 1.4);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const maskStyle = {
    WebkitMaskImage:
      "linear-gradient(to bottom, black 40%, transparent 95%)",
    maskImage: "linear-gradient(to bottom, black 40%, transparent 95%)",
  } as React.CSSProperties;

  return (
    <div
      className="w-full h-screen overflow-hidden flex flex-col relative"
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "linear-gradient(to bottom, #FF8233 0%, #FDAC55 100%)",
      }}
    >
      {/* Background 404 + oval */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.8, ...maskStyle }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            ref={textRef}
            className="font-black leading-none tracking-tighter whitespace-nowrap text-white"
            style={{
              fontSize: "clamp(200px, 48vw, 800px)",
              transform: `scale(1.15, ${scaleY})`,
              transformOrigin: "center",
            }}
          >
            404
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full bg-white h-[22vh] sm:h-[26vh] md:h-[50vh]"
            style={{
              width: "clamp(120px, 20vw, 400px)",
              transform: `scaleY(${scaleY})`,
              transformOrigin: "center",
            }}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-5">
        <a href="/" className="flex items-center">
          <div className="grid grid-cols-2 gap-0.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full"
              />
            ))}
          </div>
          <span className="text-white font-bold text-lg sm:text-xl ml-1">
            TinyTrails
          </span>
        </a>

        <div className="hidden md:flex gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href="#"
              className="px-4 py-1.5 text-sm font-medium rounded-full bg-white hover:opacity-90 transition-colors"
              style={{ color: "#F16524" }}
            >
              {item}
            </a>
          ))}
        </div>

        <button
          onClick={() => setMenuOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-white hover:opacity-90 transition-colors"
          style={{ backgroundColor: "#F16524" }}
        >
          <Menu className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Menu</span>
        </button>
      </nav>

      {/* Center video */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ marginTop: "calc(-6vh - 40px)" }}
      >
        <div className="w-[120vw] h-[85vh] sm:w-[70vw] sm:h-[70vh] md:w-[62vw] md:h-[78vh]">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain pointer-events-none mix-blend-darken"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260713_234424_b1332b69-2e69-4302-8dbc-40f86846afbd.mp4"
          />
        </div>
      </div>

      {/* Bottom content */}
      <div className="relative z-30 mt-auto pb-8 sm:pb-16 flex flex-col items-center text-center px-4">
        <h1 className="text-white text-lg sm:text-xl md:text-2xl font-medium mb-3 sm:mb-4">
          Oops, something went wrong!
        </h1>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-full text-white font-semibold text-sm sm:text-base hover:scale-105 hover:shadow-lg transition-all"
          style={{ backgroundColor: "#F16524" }}
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Back to Home
        </a>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-50 ${menuOpen ? "" : "pointer-events-none"}`}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500"
          style={{
            opacity: menuOpen ? 1 : 0,
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          }}
        />
        <div
          className="absolute top-0 right-0 h-full w-full sm:w-[380px] transition-transform duration-500"
          style={{
            transform: menuOpen ? "translateX(0)" : "translateX(100%)",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
            background:
              "linear-gradient(135deg, #FF6B1A 0%, #FF9642 100%)",
          }}
        >
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center">
              <div className="grid grid-cols-2 gap-0.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-white rounded-full"
                  />
                ))}
              </div>
              <span className="text-white font-bold text-xl ml-1">
                TinyTrails
              </span>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 mt-4 flex flex-col gap-3">
            {NAV_ITEMS.map((item, i) => (
              <a
                key={item}
                href="#"
                className="px-6 py-4 text-lg font-semibold text-white rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-300"
                style={{
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? "translateY(0)" : "translateY(1rem)",
                  transitionDelay: `${menuOpen ? 150 + i * 60 : 0}ms`,
                }}
              >
                {item}
              </a>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <a
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-full bg-white font-semibold text-base hover:scale-[1.02] transition-transform"
              style={{
                color: "#F16524",
                opacity: menuOpen ? 1 : 0,
                transition: "opacity 500ms, transform 300ms",
                transitionDelay: menuOpen ? "450ms" : "0ms",
              }}
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
