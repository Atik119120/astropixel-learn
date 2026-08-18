import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, Phone, MapPin, Facebook, Instagram, Youtube, Linkedin, MessageCircle } from "lucide-react";
import learnLogoAssetJson from "@/assets/learn-with-alphazero-logo.png.asset.json";
const learnLogo = learnLogoAssetJson.url;

const Footer = () => {
  return (
    <footer className="relative bg-[#0D111A] text-white pt-16 pb-8 border-t border-white/10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img src={learnLogo} alt="AstroPixel Education Logo" className="h-9 w-auto" />
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Empowering developers and designers with industry-ready coding, UI/UX design, and AI workflows from zero to impact.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4">Learn Navigation</h4>
            <ul className="space-y-2.5 text-sm text-neutral-300">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/courses" className="hover:text-white transition-colors">All Courses</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About Platform</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Student Helpdesk</Link></li>
              <li><Link to="/student/login" className="hover:text-white transition-colors">Student Login</Link></li>
            </ul>
          </div>

          {/* Student Portals & Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4">Portals & Verify</h4>
            <ul className="space-y-2.5 text-sm text-neutral-300">
              <li><Link to="/student/dashboard" className="hover:text-white transition-colors">Student Dashboard</Link></li>
              <li><Link to="/teacher/login" className="hover:text-white transition-colors">Instructor Login</Link></li>
              <li><Link to="/admin/login" className="hover:text-white transition-colors">Education Admin</Link></li>
              <li><Link to="/verify-certificate" className="hover:text-white transition-colors">Verify Certificate</Link></li>
              <li><Link to="/my-certificates" className="hover:text-white transition-colors">My Certificates</Link></li>
            </ul>
          </div>

          {/* Contact & Socials */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4">Get Support</h4>
            <p className="text-sm text-neutral-300 flex items-center gap-2">
              <Mail size={15} className="text-cyan-400" />
              <span>hello@astropixel.tech</span>
            </p>
            <p className="text-sm text-neutral-300 flex items-center gap-2">
              <Phone size={15} className="text-cyan-400" />
              <span>+880 1344-497808</span>
            </p>
            <p className="text-sm text-neutral-300 flex items-center gap-2">
              <MapPin size={15} className="text-cyan-400" />
              <span>Hi-Tech Park, Rajshahi, BD</span>
            </p>

            <div className="pt-3 flex items-center gap-2">
              <a href="https://www.facebook.com/astropixel.tech" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors">
                <Facebook size={15} />
              </a>
              <a href="https://wa.me/8801344497808" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors">
                <MessageCircle size={15} />
              </a>
              <a href="https://www.youtube.com/@Astropixel_tech" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors">
                <Youtube size={15} />
              </a>
              <a href="https://www.linkedin.com/company/astropixel/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors">
                <Linkedin size={15} />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p>© {new Date().getFullYear()} AstroPixel Education. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="https://astropixel.tech" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">
              <span>Agency Site</span>
              <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
